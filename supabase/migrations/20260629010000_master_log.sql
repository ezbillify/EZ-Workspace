-- Copyright (c) 2026 EZBillify Ventures Pvt Ltd. All rights reserved.
-- Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
-- 
-- WARNING & LIABILITY DISCLAIMER:
-- THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
-- AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
-- IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
-- DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
-- FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
-- DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
-- SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
-- CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
-- OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
-- OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
-- 
-- IMPORTANT: WHOEVER COPIES, REDISTRIBUTES, OR USES THIS SOFTWARE MUST KNOW THAT
-- UNDER NO CIRCUMSTANCES CAN THEY RECOVER DAMAGES, LOSSES, OR LIABILITIES
-- ENCOUNTERED FROM THE USE, MODIFICATION, OR DISTRIBUTION OF THIS SOFTWARE.

-- 107: Master Log Sheet — universal activity/change log + live presence.

-- Enrich the existing audit_logs table for the Master Log Sheet (idempotent).
alter table audit_logs add column if not exists actor_name   text;
alter table audit_logs add column if not exists actor_emp_id text;
alter table audit_logs add column if not exists actor_role   text;
alter table audit_logs add column if not exists section      text;
alter table audit_logs add column if not exists summary      text;
alter table audit_logs add column if not exists changes      jsonb;
create index if not exists audit_logs_section_idx on audit_logs(section);

-- Live presence — who is active in the workspace right now.
create table if not exists user_presence (
  user_id      uuid primary key references employees(id) on delete cascade,
  last_seen    timestamptz not null default now(),
  current_path text,
  updated_at   timestamptz not null default now()
);
alter table user_presence enable row level security;
drop policy if exists user_presence_read on user_presence;
create policy user_presence_read on user_presence for select
  using ((select role::text from employees where id = auth.uid()) = 'admin' or user_id = auth.uid());

-- Realtime for the Master Log Sheet (live log + live presence).
alter table audit_logs    replica identity full;
alter table user_presence replica identity full;
do $$ begin alter publication supabase_realtime add table audit_logs;    exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table user_presence; exception when duplicate_object then null; end $$;

-- Master Log Sheet permission (admin-only by default; grantable in /admin/permissions).
do $$
declare all_roles text[] := array['admin','dept_lead','team_lead','employee','intern']; r text;
begin
  foreach r in array all_roles loop
    insert into role_permissions (role, module_key, can_view, can_create, can_edit, can_delete, can_export)
    values (r, 'master_log', false, false, false, false, false)
    on conflict (role, module_key) do nothing;
  end loop;
end $$;
update role_permissions set can_view = true where role = 'admin' and module_key = 'master_log';

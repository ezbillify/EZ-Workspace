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

-- 103: Candidate document collection (KYC) — post-interview / manual magic-link uploads.
-- A candidate uploads a face photo + Aadhaar + PAN via a tokenized public page.
-- Files are emailed back to HR and surfaced in the existing File Share module
-- (stored as base64 data URLs in mail_file_shares, mirroring the manual-upload path).

create table if not exists candidate_document_requests (
  id                uuid primary key default gen_random_uuid(),
  application_id    text references applications(application_id) on delete set null,
  candidate_name    text not null,
  candidate_email   text not null,
  candidate_phone   text,
  source            text not null default 'interview' check (source in ('interview','manual')),
  required_docs     text[] not null default array['face_photo','aadhaar','pan']::text[],
  token             text unique not null,
  token_expires_at  timestamptz,
  status            text not null default 'pending' check (status in ('pending','submitted','expired')),
  candidate_message text,
  submitted_at      timestamptz,
  viewed_at         timestamptz,
  last_reminded_at  timestamptz,
  reminder_count    int not null default 0,
  created_by        uuid references employees(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Backfill the tracking columns when the table already existed from an earlier apply.
alter table candidate_document_requests add column if not exists viewed_at        timestamptz;
alter table candidate_document_requests add column if not exists last_reminded_at timestamptz;
alter table candidate_document_requests add column if not exists reminder_count   int not null default 0;

create table if not exists candidate_documents (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references candidate_document_requests(id) on delete cascade,
  document_type text not null check (document_type in ('face_photo','aadhaar','pan','other')),
  file_share_id uuid references mail_file_shares(id) on delete set null,
  filename      text not null,
  file_size     bigint,
  file_type     text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_cdr_token       on candidate_document_requests(token);
create index if not exists idx_cdr_application  on candidate_document_requests(application_id);
create index if not exists idx_cdr_status       on candidate_document_requests(status);
create index if not exists idx_cdoc_request     on candidate_documents(request_id);

-- keep updated_at fresh
create or replace function touch_candidate_document_requests() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_cdr_touch on candidate_document_requests;
create trigger trg_cdr_touch before update on candidate_document_requests
  for each row execute function touch_candidate_document_requests();

alter table candidate_document_requests enable row level security;
alter table candidate_documents          enable row level security;

-- Request metadata (name/email/phone/status) is readable by authenticated staff;
-- all writes go through service-role API routes. Document refs stay service-role only.
drop policy if exists cdr_read on candidate_document_requests;
create policy cdr_read on candidate_document_requests for select using (true);

-- live updates for the interviews/admin views
do $$ begin
  alter publication supabase_realtime add table candidate_document_requests;
exception when duplicate_object then null; end $$;

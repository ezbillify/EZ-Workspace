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

-- ============================================================================
-- Create all required Supabase Storage buckets.
-- Safe to run on existing projects — ON CONFLICT DO NOTHING skips duplicates.
-- The API layer uses service_role (getSupabaseAdmin) which bypasses RLS, so
-- no row-level policies are needed for server-side API access.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- Profile / legal assets (public read, any mime)
  ('avatars',          'avatars',          true,  5242880,   ARRAY['image/png','image/jpeg','image/webp','image/gif']),
  ('legal',            'legal',            true,  10485760,  NULL),

  -- Private operational buckets
  ('invoices',         'invoices',         false, 10485760,  ARRAY['application/pdf']),
  ('resumes',          'resumes',          false, 10485760,  NULL),
  ('lms-content',      'lms-content',      false, 524288000, NULL),
  ('documents',        'documents',        false, 52428800,  NULL),

  -- Mail compose attachments (used by /api/mail/attachments POST)
  ('mail-attachments', 'mail-attachments', false, 26214400,  NULL),

  -- General-purpose attachments: support tickets, messaging, etc.
  ('attachments',      'attachments',      false, 52428800,  NULL)

ON CONFLICT (id) DO UPDATE SET
  public          = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

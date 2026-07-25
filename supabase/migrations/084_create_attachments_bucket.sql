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

-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Create the 'attachments' storage bucket
-- Run this in the Supabase SQL Editor OR via `supabase db push`
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Create the bucket (idempotent via ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,           -- NOT public — authenticated access only
  52428800,        -- 50 MB per file
  NULL             -- NULL = all MIME types allowed (PDF, DOCX, PNG, ZIP, etc.)
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS: Any authenticated user can READ files (ticket viewer can see attachments)
DROP POLICY IF EXISTS "auth_read_attachments"   ON storage.objects;
DROP POLICY IF EXISTS "auth_write_attachments"  ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_attachments" ON storage.objects;

CREATE POLICY "auth_read_attachments" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');

-- 3. RLS: Any authenticated user can UPLOAD files
CREATE POLICY "auth_write_attachments" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

-- 4. RLS: Authenticated users can DELETE their own files
CREATE POLICY "auth_delete_attachments" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');

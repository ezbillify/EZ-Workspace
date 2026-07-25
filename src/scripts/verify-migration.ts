/*
 * Copyright (c) 2026 EZBillify Ventures Pvt Ltd. All rights reserved.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
 * 
 * WARNING & LIABILITY DISCLAIMER:
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * IMPORTANT: WHOEVER COPIES, REDISTRIBUTES, OR USES THIS SOFTWARE MUST KNOW THAT
 * UNDER NO CIRCUMSTANCES CAN THEY RECOVER DAMAGES, LOSSES, OR LIABILITIES
 * ENCOUNTERED FROM THE USE, MODIFICATION, OR DISTRIBUTION OF THIS SOFTWARE.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ojepnycexumwpzcvlydb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function verifyMigration() {
  if (!supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Checking migration status...\n');

  const tables = ['teams', 'project_members'];
  let allTablesExist = true;

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);

      if (error && error.code === 'PGRST116') {
        console.log(`❌ Table '${table}' not found`);
        allTablesExist = false;
      } else if (error) {
        console.log(`⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    } catch (err: any) {
      console.log(`❌ Error checking '${table}': ${err.message}`);
      allTablesExist = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (!allTablesExist) {
    console.log('\n⚠️  Some tables are missing!');
    console.log('\n📝 To apply the migration manually:');
    console.log('  1. Go to Supabase Dashboard: https://supabase.com');
    console.log('  2. Open your project');
    console.log('  3. Go to SQL Editor');
    console.log('  4. Click "New Query"');
    console.log('  5. Copy the SQL from: src/supabase/migrations/046_teams_and_project_members.sql');
    console.log('  6. Run the query');
  } else {
    console.log('\n✅ All migration tables are set up correctly!');
  }
}

verifyMigration();

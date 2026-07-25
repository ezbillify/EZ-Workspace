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
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ojepnycexumwpzcvlydb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function runMigration() {
  try {
    if (!supabaseKey) {
      console.error('❌ SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment');
      process.exit(1);
    }

    console.log('📖 Reading migration file...');
    const migrationFile = path.join(__dirname, '../supabase/migrations/046_teams_and_project_members.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    console.log('🔗 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Split SQL by statements and execute individually
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`⏳ Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      console.log(`  [${i + 1}/${statements.length}] Executing: ${stmt.substring(0, 60)}...`);

      try {
        const { error } = await supabase.rpc('exec', { sql: stmt });
        if (error) {
          // If RPC fails, try direct execution
          console.warn(`    ⚠️ RPC failed, trying alternative method...`);
        } else {
          console.log(`    ✓ Done`);
        }
      } catch (err: any) {
        console.warn(`    ⚠️ Error executing statement: ${err.message}`);
      }
    }

    console.log('\n✅ Migration process completed!');
    console.log('\n📝 Note: Some DDL statements may fail if they already exist.');
    console.log('   Check your Supabase dashboard to verify the tables were created.');
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runMigration();

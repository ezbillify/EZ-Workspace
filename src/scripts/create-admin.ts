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

/**
 * Creates the initial Super Admin account.
 * Run once after clearing the database.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import User from "../models/User";
import Wallet from "../models/Wallet";

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const existing = await User.findOne({ email: "admin@namaah.in" });
  if (existing) {
    console.log("Super admin already exists.");
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    name: "Super Admin",
    email: "admin@namaah.in",
    password: "Admin@123",
    role: "admin",
    employeeId: "SA001",
    department: "Management",
    designation: "Super Administrator",
    joiningDate: new Date(),
  });

  await Wallet.create({ employee: admin._id });

  console.log("✅ Super Admin created.");
  console.log("   Email   : admin@namaah.in");
  console.log("   Password: Admin@123");
  await mongoose.disconnect();
}

createAdmin().catch((e) => { console.error(e); process.exit(1); });

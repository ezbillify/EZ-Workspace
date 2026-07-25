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

-- Server-side enforcement of the e-sign identity gate.
-- Until now OTP + liveness + face-match were all gated CLIENT-SIDE only — the
-- sign POST accepted any submission, so the biometrics could be bypassed by
-- calling the API directly. These columns let the server require proof:
--   • sign_otp_verified_at  — stamped when the emailed OTP is verified server-side
--   • sign_verification     — the biometric evidence bundle recorded at verify time
--                             (liveness pass, face similarity, risk score, quality,
--                              device-fingerprint hash) — NO raw images stored
--   • sign_verify_token     — single-use proof handle issued only after OTP+face pass;
--                             the sign POST must present a matching, unexpired token
--   • sign_verify_expires_at— 2-hour backstop expiry (session presence is enforced
--                             separately by the client exit guard, so this is only a
--                             replay backstop — it does NOT rush the candidate)
alter table onboarding_packets add column if not exists sign_otp_verified_at  timestamptz;
alter table onboarding_packets add column if not exists sign_verification     jsonb;
alter table onboarding_packets add column if not exists sign_verify_token     text;
alter table onboarding_packets add column if not exists sign_verify_expires_at timestamptz;

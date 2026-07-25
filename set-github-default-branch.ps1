# Copyright (c) 2026 EZBillify Ventures Pvt Ltd. All rights reserved.
# Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
# 
# WARNING & LIABILITY DISCLAIMER:
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
# FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
# 
# IMPORTANT: WHOEVER COPIES, REDISTRIBUTES, OR USES THIS SOFTWARE MUST KNOW THAT
# UNDER NO CIRCUMSTANCES CAN THEY RECOVER DAMAGES, LOSSES, OR LIABILITIES
# ENCOUNTERED FROM THE USE, MODIFICATION, OR DISTRIBUTION OF THIS SOFTWARE.

$repo = "ezbillify/EZ-Workspace"
Write-Host "current local branch:" (git branch --show-current)
Write-Host "current remote HEAD before:"
git ls-remote --symref origin HEAD
$body = @{ default_branch = "main" } | ConvertTo-Json
$headers = @{ Authorization = "token $env:GITHUB_TOKEN"; Accept = 'application/vnd.github+json' }
$response = Invoke-RestMethod -Headers $headers -Method Patch -Uri "https://api.github.com/repos/$repo" -Body $body -ContentType 'application/json'
Write-Host "patched default_branch=" $response.default_branch
Write-Host "setting local remote HEAD to auto"
git remote set-head origin --auto
Write-Host "current remote HEAD after:"
git ls-remote --symref origin HEAD

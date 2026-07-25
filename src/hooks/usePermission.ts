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

"use client";

import { useAuth } from "@/components/layout/AuthProvider";

export interface PermissionState {
  canView:   boolean;
  canCreate: boolean;
  canEdit:   boolean;
  canDelete: boolean;
  canExport: boolean;
}

/**
 * Returns the permission state for a given module key.
 * Falls back to full access when permissions haven't loaded yet
 * (DashboardShell blocks render during that window).
 * Super Admin always gets full access regardless of DB config.
 */
export function usePermission(moduleKey: string): PermissionState {
  const { user, permissions } = useAuth();

  if (user?.role === "admin") {
    return { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true };
  }

  if (!permissions) {
    return { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true };
  }

  const perm = permissions[moduleKey];
  if (!perm) {
    return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };
  }

  return {
    canView:   perm.can_view,
    canCreate: perm.can_create,
    canEdit:   perm.can_edit,
    canDelete: perm.can_delete,
    canExport: perm.can_export,
  };
}

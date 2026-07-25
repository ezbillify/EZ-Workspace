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

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ProjectKanban } from "@/components/projects/ProjectKanban";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/ButtonLegacy";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { request } = useApi();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const projectId = params.id as string;

  const loadProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request<any>({ url: `/api/projects/${projectId}` });
      if (res.success) {
        setProject(res.data);
      } else {
        // If not found, go back
        router.push("/dashboard");
      }
    } catch (err) {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [projectId, request, router]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  return (
    <DashboardShell
      moduleKey="my_projects"
      title="Project Management"
      subtitle={project ? `Managing ${project.name}` : "Loading project workspace..."}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => loadProject()}>
            <RefreshCw size={13} className={loading ? "animate-spin mr-1.5" : "mr-1.5"} /> Refresh
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft size={13} className="mr-1.5" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-4">
          <div className="h-8 w-1/3 bg-theme-raised animate-pulse rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-96 bg-theme-raised animate-pulse rounded-2xl" />)}
          </div>
        </div>
      ) : project ? (
        <ProjectKanban 
          projectId={project.id} 
          projectName={project.name} 
          progress={project.progress || 0} 
        />
      ) : (
        <div className="page-card py-20 text-center">
          <p className="text-theme-muted">Project workspace could not be loaded.</p>
        </div>
      )}
    </DashboardShell>
  );
}

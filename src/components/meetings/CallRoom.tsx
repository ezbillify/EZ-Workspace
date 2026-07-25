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

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2, AlertCircle, PhoneOff } from "lucide-react";

interface CallRoomProps {
  roomName: string;
  displayName: string;
  onLeave: () => void;
  type?: "video" | "audio" | "screen";
}

export function CallRoom({ roomName, displayName, onLeave, type = "video" }: CallRoomProps) {
  const [token, setToken] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getToken() {
      try {
        const res = await fetch(
          `/api/livekit?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(displayName)}`
        );
        const data = await res.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setToken(data.token);
          setWsUrl(data.wsUrl);
        }
      } catch (e) {
        setError("Failed to connect to authentication server.");
      }
    }
    getToken();
  }, [roomName, displayName]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 bg-theme-bg text-white p-8">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <AlertCircle size={22} className="text-amber-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-black">Connection Error</h3>
          <p className="text-theme-muted text-sm max-w-xs">{error}</p>
        </div>
        <button 
          onClick={onLeave} 
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-sm transition-all"
        >
          <PhoneOff size={16} /> Close
        </button>
      </div>
    );
  }

  if (token === "") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-theme-bg">
        <Loader2 className="w-8 h-8 text-theme-primary animate-spin" />
        <p className="text-theme-muted text-sm font-medium">Authorizing session...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={type === "video"}
      audio={true}
      token={token}
      serverUrl={wsUrl}
      onDisconnected={onLeave}
      connect={true}
      data-lk-theme="default"
      style={{ height: '100%' }}
    >
      {/* Real Video Conference Component */}
      <VideoConference />
      
      {/* Audio management */}
      <RoomAudioRenderer />
      
      {/* Custom Leave Logic if needed is handled by VideoConference's internal controls, 
          but we can also add custom overlays here */}
    </LiveKitRoom>
  );
}

function formatTS(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("tr-TR", {
      month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
      timeZone: "Europe/Istanbul"
    });
  } catch { return ts.substring(5,16).replace("T"," "); }
}

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, X, RefreshCw } from "lucide-react";

export default function ScreenshotGallery() {
  const [selected, setSelected] = useState(null);

  const { data = {}, isLoading, refetch } = useQuery({
    queryKey: ["screenshots"],
    queryFn: () => fetch("/api/screenshots", {credentials:"include"}).then(r=>r.json()),
    refetchInterval: 30000,
  });

  const screenshots = data.screenshots || [];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold">Ekran Görüntüleri</h3>
          <span className="text-xs text-muted-foreground">({screenshots.length})</span>
        </div>
        <button onClick={() => refetch()} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl overflow-hidden max-w-4xl w-full">
            <div className="flex items-center justify-between p-3 border-b border-slate-700">
              <span className="text-sm text-white">{selected.pc_name} — {selected.reason}</span>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={`/screenshots/${selected.filename}`} alt="screenshot" className="w-full" />
            <div className="p-2 text-xs text-slate-500 text-center">{selected.ts}</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground text-sm">Yükleniyor...</div>
      ) : screenshots.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Henüz ekran görüntüsü yok</p>
          <p className="text-xs mt-1">Windows agent alarm tetiklenince otomatik alacak</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
          {screenshots.map(ss => (
            <div key={ss.id} onClick={() => setSelected(ss)}
              className="cursor-pointer rounded-lg overflow-hidden border border-border hover:border-blue-500/50 transition-colors">
              <img src={`/screenshots/${ss.filename}`} alt="screenshot"
                className="w-full h-32 object-cover" />
              <div className="p-2 bg-card">
                <p className="text-xs font-mono text-foreground truncate">{ss.pc_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{ss.reason}</p>
                <p className="text-[10px] text-slate-500">{formatTS(ss.ts)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { callwatch, getDisplayName } from "@/api/callwatchClient";
import { Badge } from "@/components/ui/badge";
import { Bell, Brain, X, Camera } from "lucide-react";
import SearchInput from "./SearchInput";
import PCDetailModal from "./PCDetailModal";
import ExportButton from "./ExportButton";

function AIAnalysisModal({ alarm, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    async function analyze() {
      try {
        const response = await fetch("/api/ai-analyze", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pc_name: alarm.pc_name,
            alarm_type: alarm.alarm_type,
            severity: alarm.severity,
            description: alarm.description,
            ts: alarm.ts
          })
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        setAnalysis(result);
      } catch (e) {
        setError("Analiz yapılamadı: " + e.message);
      } finally {
        setLoading(false);
      }
    }
    analyze();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-white text-sm">AI Alarm Analizi</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-slate-800 rounded-lg p-3 text-xs">
            <span className="text-slate-400">PC: </span><span className="text-white font-mono">{alarm.pc_name}</span>
            <span className="text-slate-400 ml-3">Tip: </span><span className="text-orange-400">{alarm.alarm_type}</span>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-4 justify-center">
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              AI analiz yapıyor...
            </div>
          )}
          {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">{error}</div>}
          {analysis && (
            <div className="space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="text-blue-400 text-xs font-bold mb-1">🔍 NEDEN OLUYOR?</div>
                <div className="text-slate-200 text-sm">{analysis.neden}</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="text-red-400 text-xs font-bold mb-1">⚠️ SALDIRI MI?</div>
                <div className="text-slate-200 text-sm">{analysis.saldiri_mi}</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="text-green-400 text-xs font-bold mb-1">✅ NE YAPMALIYIM?</div>
                <div className="text-slate-200 text-sm">{analysis.ne_yapmaliyim}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AlarmlarTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedAlarm, setSelectedAlarm] = useState(null);
  const [detailPC, setDetailPC] = useState(null);
  const PAGE_SIZE = 20;
  const queryClient = useQueryClient();

  const { data: alarmsData = {}, isLoading } = useQuery({
    queryKey: ["alarms-active"],
    queryFn: () => callwatch.alarms.list(),
    refetchInterval: 30000,
  });

  const alarms = (alarmsData.alarms || []).filter(a => (a.status === 'pending' || a.status === 'open') && a.alarm_type !== 'mola' && a.alarm_type !== 'soar_auto');

  const closeMutation = useMutation({
    mutationFn: ({ id, status, note }) => callwatch.alarms.close(id, status, note),
    onSuccess: () => queryClient.invalidateQueries(["alarms-active"]),
  });

  const allFiltered = alarms.filter(a =>
    !search || a.pc_name?.toLowerCase().includes(search.toLowerCase()) || a.alarm_type?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
  const filtered = allFiltered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <div className="p-4">
      {detailPC && <PCDetailModal device={detailPC} onClose={() => setDetailPC(null)} />}
      {selectedAlarm && <AIAnalysisModal alarm={selectedAlarm} onClose={() => setSelectedAlarm(null)} />}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Aktif Alarmlar</h3>
            <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">{allFiltered.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="PC, alarm tipi..." />
            <ExportButton data={filtered} filename="alarmlar" columns={[
              { label: "PC", key: "pc_name" }, { label: "Alarm", key: "alarm_type" },
              { label: "Vardiya", key: "shift" }, { label: "Durum", key: "status" }, { label: "Tarih", key: "ts" }
            ]} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">PC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ALARM</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ŞİDDET</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">AÇIKLAMA</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ZAMAN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Yükleniyor...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">✅ Aktif alarm yok</td></tr>
              ) : (
                filtered.map((alarm) => (
                  <tr key={alarm.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => { console.log("TIKLANDI", alarm.pc_name); setDetailPC({pc_name: alarm.pc_name, status: alarm.severity === "critical" ? "anomali" : "uyari"}); }}>
                    <td className="px-4 py-3 font-mono text-xs text-blue-400">{alarm.pc_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">{alarm.shift || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">{alarm.alarm_type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={alarm.severity === 'critical' ? 'bg-destructive/20 text-destructive border-destructive/30 text-xs' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs'}>
                        {alarm.severity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{alarm.description}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                      {formatTS(alarm.ts)}
                    </td>
                    <td className="px-4 py-3 flex gap-1">
                      <button onClick={() => setSelectedAlarm(alarm)}
                        className="px-2 py-1 rounded text-xs border border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                        <Brain className="w-3 h-3" />
                      </button>
                      <button onClick={() => closeMutation.mutate({id: alarm.id, status: 'closed', note: ''})}
                        className="px-2 py-1 rounded text-xs border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">✓</button>
                      <button onClick={() => closeMutation.mutate({id: alarm.id, status: 'false_positive', note: 'FP'})}
                        className="px-2 py-1 rounded text-xs border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10">FP</button>
                      <AlarmScreenshot pcName={alarm.pc_name} ts={alarm.ts} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{allFiltered.length} alarm / Sayfa {page}/{totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                className="px-2 py-1 rounded text-xs border border-border hover:bg-secondary disabled:opacity-50">‹</button>
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                className="px-2 py-1 rounded text-xs border border-border hover:bg-secondary disabled:opacity-50">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AlarmScreenshot({ pcName, ts }) {
  const [src, setSrc] = React.useState(null);
  const [big, setBig] = React.useState(false);
  React.useEffect(() => {
    if (!pcName) return;
    fetch(`/api/screenshots?pc_name=${encodeURIComponent(pcName)}`, {credentials:"include"})
      .then(r => r.json())
      .then(d => {
        const shots = d.screenshots || [];
        if (shots.length > 0) setSrc(`/screenshots/${shots[0].filename}`);
      })
      .catch(() => {});
  }, [pcName]);
  if (!src) return null;
  return (
    <>
      <button onClick={e => { e.stopPropagation(); setBig(true); }}
        className="px-2 py-1 rounded text-xs border border-sky-500/50 text-sky-400 hover:bg-sky-500/10 relative group"
        title="Ekran Görüntüsü">
        <Camera className="w-3 h-3" />
        <div className="absolute bottom-8 right-0 hidden group-hover:block z-50">
          <img src={src} alt="preview" className="w-32 h-20 object-cover rounded shadow-xl border border-border" />
        </div>
      </button>
      {big && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" onClick={() => setBig(false)}>
          <img src={src} alt="ss" className="max-w-3xl max-h-[80vh] rounded shadow-2xl" />
        </div>
      )}
    </>
  );
}

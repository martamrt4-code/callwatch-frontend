import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { callwatch } from "@/api/callwatchClient";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity, AlertTriangle, Bell, Flame, Monitor, Shield, Zap } from "lucide-react";
import ThreatScoreGauge from "./ThreatScoreGauge";

function DownloadButton({ url, filename, label, className }) {
  const [loading, setLoading] = useState(false);
  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Sunucu hatası");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      alert("İndirme başarısız: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [url, filename]);
  return (
    <button onClick={handleClick} disabled={loading}
      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${className}`}>
      {loading ? "⏳ Hazırlanıyor..." : label}
    </button>
  );
}

function RankedList({ riskScores }) {
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(riskScores.length / PAGE_SIZE);
  const paged = riskScores.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <div>
      <div className="space-y-2">
        {paged.map((pc, i) => {
          const globalIndex = (page-1)*PAGE_SIZE + i;
          const puan = pc.puan || Math.max(0, 100 - (pc.score || 0));
          return (
            <div key={pc.pc_name} className="flex items-center gap-2">
              <span className={`text-xs font-mono w-6 ${globalIndex===0?'text-destructive':globalIndex===1?'text-yellow-400':globalIndex===2?'text-orange-400':'text-muted-foreground'}`}>#{globalIndex+1}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-foreground">{pc.pc_name}</span>
                  <span className={`text-xs font-mono ${puan<40?'text-destructive':puan<70?'text-yellow-400':'text-emerald-400'}`}>{puan}/100 puan</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${puan<40?'bg-destructive':puan<70?'bg-yellow-400':'bg-emerald-400'}`} style={{width: puan+'%'}} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">{riskScores.length} PC / Sayfa {page}/{totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
              className="px-2 py-1 rounded text-xs border border-border hover:bg-secondary disabled:opacity-50">‹</button>
            <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
              className="px-2 py-1 rounded text-xs border border-border hover:bg-secondary disabled:opacity-50">›</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OverviewTab() {
  const { data: alarmsData = {} } = useQuery({ queryKey: ["alarms"], queryFn: () => callwatch.alarms.list(), refetchInterval: 30000 });
  const { data: ifData = {} } = useQuery({ queryKey: ["if-results"], queryFn: () => callwatch.ifResults.list(), refetchInterval: 30000 });
  const { data: weeklyData = {} } = useQuery({ queryKey: ["weekly"], queryFn: () => callwatch.risk.weekly(), refetchInterval: 60000 });
  const { data: heatmapData = {} } = useQuery({ queryKey: ["heatmap"], queryFn: () => callwatch.heatmap(), refetchInterval: 60000 });
  const { data: bestWorst = {} } = useQuery({ queryKey: ["best-worst"], queryFn: () => callwatch.risk.bestWorst(), refetchInterval: 60000 });
  const { data: riskData = {} } = useQuery({ queryKey: ["risk-overview"], queryFn: () => fetch('/api/risk-scores',{credentials:'include'}).then(r=>r.json()), refetchInterval: 60000 });
  const { data: pcNamesData = {} } = useQuery({ queryKey: ["pc-names"], queryFn: () => fetch('/api/pc-names',{credentials:'include'}).then(r=>r.json()), refetchInterval: 300000 });
  // Puana göre sırala — en iyiden en kötüye (puan yüksek = iyi)
  const riskScores = (riskData.scores || []).sort((a,b) => (b.puan||0) - (a.puan||0));

  const alarms = (alarmsData.alarms || []).filter(a => (a.status === 'pending' || a.status === 'open') && a.alarm_type !== 'soar_auto' && a.alarm_type !== 'mola');
  const ifResults = Array.isArray(ifData.results) ? ifData.results : Array.isArray(ifData) ? ifData : [];
  const critik = ifResults.filter(r => r.risk === 'crit').length;
  const uyari = ifResults.filter(r => r.risk === 'warn').length;
  const normal = ifResults.filter(r => r.risk === 'normal' || r.risk === 'ok').length;

  const hmap = heatmapData.data || {};
  const days = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  const hours = Array.from({length:24},(_,i)=>i);

  const getColor = (v, max) => {
    if (!max || v === 0) return 'rgba(58,143,111,0.06)';
    const r = v/max;
    if (r < 0.2) return 'rgba(58,143,111,0.15)';
    if (r < 0.4) return 'rgba(58,143,111,0.3)';
    if (r < 0.6) return 'rgba(245,166,35,0.4)';
    if (r < 0.8) return 'rgba(255,42,95,0.5)';
    return 'rgba(255,42,95,0.85)';
  };

  let maxVal = 0;
  Object.values(hmap).forEach(row => Object.values(row).forEach(v => { if(v > maxVal) maxVal = v; }));

  return (
    <div className="p-5 space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="İzlenen PC" value={(pcNamesData.pc_names || []).length || ifResults.length} icon={Monitor} iconColor="text-slate-300" iconBg="bg-slate-300/10" />
        <KpiCard label="Aktif Alarm" value={alarms.length} icon={Bell} iconColor="text-amber-500" iconBg="bg-amber-500/10" />
        <KpiCard label="Anomali/Kritik" value={critik + uyari} icon={Flame} iconColor="text-red-500" iconBg="bg-red-500/10" />
        <KpiCard label="Normal PC" value={normal} icon={Shield} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
      </div>

      {/* Haftalık Özet */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dönem</p>
          <p className="text-sm font-semibold">{weeklyData.period || '—'}</p>
          <button onClick={() => fetch('/api/reset-summary',{credentials:'include'}).then(()=>window.location.reload())}
            className="mt-2 px-2 py-1 text-[10px] rounded border border-primary/30 text-primary hover:bg-primary/10 transition-all">
            🔄 Sıfırla
          </button>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Toplam Olay</p>
          <p className="text-2xl font-black text-emerald-400">{weeklyData.total_events || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Toplam Alarm</p>
          <p className="text-2xl font-black text-amber-400">{weeklyData.total_alarms || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Kritik</p>
          <p className="text-2xl font-black text-red-400">{weeklyData.critical_alarms || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">En Riskli PC</p>
          <p className="text-xs font-bold text-red-400">{weeklyData.top_risky_pcs?.[0]?.pc || '—'}</p>
        </div>
      </div>

      {/* En İyi / En Kötü */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">✅ En Güvenli PC</p>
          <p className="text-sm font-bold">{bestWorst.best?.pc_name || '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">{bestWorst.best?.score || 0}/100 risk skoru</p>
        </div>
        <div className="bg-card border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-red-400 uppercase tracking-wider mb-2">⚠️ En Riskli PC</p>
          <p className="text-sm font-bold">{bestWorst.worst?.pc_name || '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">{bestWorst.worst?.score || 0}/100 risk skoru</p>
        </div>
      </div>

      {/* Isı Haritası */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <p className="text-sm font-semibold">Haftalık Aktivite Isı Haritası</p>
          <span className="text-xs text-muted-foreground">— gün / saate göre</span>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-1 items-start min-w-[680px]">
            <div className="flex flex-col gap-1 mr-2 pt-6">
              {days.map(d => <div key={d} className="h-4 flex items-center text-[9px] text-muted-foreground w-6">{d}</div>)}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex gap-1 mb-1">
                {hours.map(h => <div key={h} className="w-4 text-center text-[8px] text-muted-foreground">{h % 6 === 0 ? h : ""}</div>)}
              </div>
              {days.map((d, di) => (
                <div key={d} className="flex gap-1">
                  {hours.map(h => {
                    const val = (hmap[di] || {})[h] || 0;
                    return (
                      <div key={h} className="w-4 h-4 rounded-sm hover:scale-125 cursor-pointer transition-all"
                        style={{ background: getColor(val, maxVal) }}
                        title={`${d} ${h}:00 — ${val} olay`} />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Aylık PC Sıralaması */}
      <div className="mt-4 mx-4 mb-4 bg-card border border-border rounded-lg p-4">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">🏆 AYLIK PC SIRALAMASI</h3>
        
        {/* Puan Açıklaması */}
        <div className="mb-3 bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 text-xs text-slate-400">
          <span className="text-slate-300 font-semibold">Puan nasıl hesaplanır? </span>
          Her PC 100 puan ile başlar. Alarm (−5), yasak site (−8), USB transferi (−5), Teramind kritik alert (−10) gibi ihlaller puan düşürür. Mola puanı etkilemez. 
          <span className="text-emerald-400"> Yeşil ≥70</span> · <span className="text-yellow-400"> Sarı 40–69</span> · <span className="text-red-400"> Kırmızı &lt;40</span>
        </div>

        <RankedList riskScores={riskScores} />
      </div>
      {/* Rapor İndirme */}
      <div className="mt-4 mx-4 mb-4 bg-card border border-border rounded-lg p-4">
        <h3 className="text-xs font-semibold text-muted-foreground mb-3">📥 AYLIK RAPOR İNDİR</h3>
        <div className="flex gap-2 flex-wrap">
          <a href="/api/export/excel" target="_blank"
            className="px-3 py-2 text-xs font-medium rounded-lg border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
            📊 Excel İndir
          </a>
          <DownloadButton url="/api/report/pdf?period=monthly" filename="callwatch_aylik_rapor.pdf" label="📄 PDF Rapor" className="border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20" />
          <DownloadButton url="/api/report/pdf?period=weekly" filename="callwatch_haftalik_rapor.pdf" label="📄 Haftalık PDF" className="border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20" />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, iconColor, iconBg }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-white/10 transition-all">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-2xl font-black text-foreground tabular-nums">{value}</p>
      <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

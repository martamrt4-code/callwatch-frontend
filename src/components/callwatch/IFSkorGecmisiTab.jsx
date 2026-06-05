import React, { useState } from "react";
import { callwatch } from "@/api/callwatchClient";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Legend
} from "recharts";
import { TreePine, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  "#3a8f6f", "#e05c5c", "#d4913a", "#5c8be0", "#a05ce0",
  "#5ce0b8", "#e0c45c", "#e08a5c"
];

function generateHistory(device) {
  // Simüle edilmiş 30 günlük IF skoru geçmişi
  const days = 30;
  const base = device.if_score || Math.random() * 0.5;
  return Array.from({ length: days }, (_, i) => {
    const noise = (Math.random() - 0.5) * 0.2;
    const trend = i > 20 ? 0.005 * (i - 20) : 0;
    return {
      gun: `G-${days - i}`,
      skor: Math.max(0, Math.min(1, base + noise + trend)),
    };
  }).reverse();
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 shadow-2xl text-xs">
      <p className="text-muted-foreground mb-2 font-mono text-[10px]">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground truncate max-w-[80px]">{p.name}:</span>
          <span className="font-bold text-white">{Number(p.value).toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
};

export default function IFSkorGecmisiTab({ devices = [] }) {
  const { data: historyData = {} } = useQuery({
    queryKey: ["if-score-history"],
    queryFn: () => callwatch.ifHistory.list(),
    refetchInterval: 60000,
  });
  
  const history = historyData.history || [];
  
  // PC bazında geçmiş
  const pcHistory = {};
  history.forEach(h => {
    if (!pcHistory[h.pc_name]) pcHistory[h.pc_name] = [];
    pcHistory[h.pc_name].push({ gun: h.date?.substring(5), skor: parseFloat(h.if_score || 0) });
  });
  const [selected, setSelected] = useState([]);
  const [view, setView] = useState("grafik"); // grafik | tablo

  // 400 PC'de performans: sadece en riskli 10 PC göster
  // pcHistory'den PC listesi oluştur
  const topDevices = Object.keys(pcHistory).map(pc => ({
    id: pc, pc_name: pc, if_score: pcHistory[pc][pcHistory[pc].length-1]?.skor || 0
  })).sort((a,b) => b.if_score - a.if_score);
  const _oldDevices = [...devices]
    .sort((a, b) => (b.if_score || 0) - (a.if_score || 0))
    .slice(0, 10);

  const toggleDevice = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const activeDevices = selected.length > 0
    ? topDevices.filter(d => selected.includes(d.id))
    : topDevices.slice(0, 3);

  // Birleşik zaman serisi verisi
  // Gerçek veriden chartData oluştur
  const allDates = [...new Set(history.map(h => h.date))].sort();
  const chartData = allDates.map(date => {
    const point = { gun: date?.substring(5) };
    Object.keys(pcHistory).forEach(pc => {
      const entry = pcHistory[pc].find(e => e.gun === date?.substring(5));
      point[pc] = entry ? entry.skor : null;
    });
    return point;
  });
  // eski kod kaldırıldı
  const _unused = (() => {
    return {};
    return row;
  });

  const getTrend = (device) => {
    const hist = generateHistory(device);
    const recent = hist.slice(-5).map(h => h.skor);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const prev = hist.slice(-10, -5).map(h => h.skor);
    const avgPrev = prev.reduce((a, b) => a + b, 0) / prev.length;
    if (avg > avgPrev + 0.02) return "up";
    if (avg < avgPrev - 0.02) return "down";
    return "flat";
  };

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TreePine className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Isolation Forest Skor Geçmişi</h2>
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Son 30 Gün</Badge>
        </div>
        <div className="flex gap-1">
          {["grafik", "tablo"].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all capitalize ${
                view === v
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
              }`}
            >
              {v === "grafik" ? "📈 Grafik" : "📋 Tablo"}
            </button>
          ))}
        </div>
      </div>

      {/* Device selector */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">PC Seçimi (max 5)</p>
        <div className="flex flex-wrap gap-2">
          {topDevices.map((d, i) => {
            const isActive = selected.includes(d.id);
            const trend = getTrend(d);
            return (
              <button
                key={d.id}
                onClick={() => toggleDevice(d.id)}
                disabled={!isActive && selected.length >= 5}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isActive
                    ? "border-opacity-60 text-white"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-white/20"
                }`}
                style={isActive ? { borderColor: COLORS[i], backgroundColor: COLORS[i] + "22", color: COLORS[i] } : {}}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {d.pc_name}
                <span className="font-mono opacity-70">{(d.if_score || 0).toFixed(2)}</span>
                {trend === "up" && <TrendingUp className="w-3 h-3 text-red-400" />}
                {trend === "down" && <TrendingDown className="w-3 h-3 text-emerald-400" />}
                {trend === "flat" && <Minus className="w-3 h-3 text-slate-400" />}
              </button>
            );
          })}
        </div>
        {selected.length === 0 && (
          <p className="text-[10px] text-muted-foreground mt-2 italic">Seçim yapılmadı — en riskli 3 PC gösteriliyor</p>
        )}
      </div>

      {view === "grafik" ? (
        <div className="bg-card border border-border rounded-xl p-5">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="gun" tick={{ fill: "hsl(220,15%,38%)", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} interval={4} />
              <YAxis domain={[0, 1]} tick={{ fill: "hsl(220,15%,38%)", fontSize: 9 }} axisLine={false} tickLine={false} width={28} tickFormatter={v => v.toFixed(1)} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.05)", strokeWidth: 1 }} />
              <ReferenceLine y={0.7} stroke="#e05c5c" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Kritik", fill: "#e05c5c", fontSize: 9, position: "right" }} />
              <ReferenceLine y={0.4} stroke="#d4913a" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Uyarı", fill: "#d4913a", fontSize: 9, position: "right" }} />
              {activeDevices.map((d, i) => (
                <Line
                  key={d.id}
                  type="monotone"
                  dataKey={d.pc_name}
                  stroke={COLORS[topDevices.findIndex(x => x.id === d.id)]}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-4 h-px bg-red-400" style={{ borderTop: "1px dashed #e05c5c" }} />
              Kritik eşiği (0.70)
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-4 h-px" style={{ borderTop: "1px dashed #d4913a" }} />
              Uyarı eşiği (0.40)
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">PC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Güncel Skor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">7G Ort.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">30G Maks.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trend</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Durum</th>
              </tr>
            </thead>
            <tbody>
              {topDevices.map((d, i) => {
                const hist = generateHistory(d);
                const avg7 = hist.slice(-7).reduce((a, b) => a + b.skor, 0) / 7;
                const max30 = Math.max(...hist.map(h => h.skor));
                const trend = getTrend(d);
                const score = d.if_score || 0;
                return (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-foreground font-medium text-xs">{d.pc_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-xs" style={{ color: score >= 0.7 ? "#e05c5c" : score >= 0.4 ? "#d4913a" : "#3a8f6f" }}>
                      {score.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{avg7.toFixed(3)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{max30.toFixed(3)}</td>
                    <td className="px-4 py-3">
                      {trend === "up" && <span className="flex items-center gap-1 text-xs text-red-400"><TrendingUp className="w-3 h-3" /> Artıyor</span>}
                      {trend === "down" && <span className="flex items-center gap-1 text-xs text-emerald-400"><TrendingDown className="w-3 h-3" /> Azalıyor</span>}
                      {trend === "flat" && <span className="flex items-center gap-1 text-xs text-slate-400"><Minus className="w-3 h-3" /> Stabil</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${
                        score >= 0.7 ? "bg-destructive/20 text-destructive border-destructive/30" :
                        score >= 0.4 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                        "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}>
                        {score >= 0.7 ? "Kritik" : score >= 0.4 ? "Uyarı" : "Normal"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Calendar, AlertTriangle, CheckCircle, Activity } from "lucide-react";

// Simüle edilmiş haftalık/aylık trend verisi (gerçek veri olmadığında demo gösterir)
function generateWeeklyData(devices) {
  const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const baseRisk = devices.length > 0 ? Math.round(devices.reduce((s, d) => s + (d.risk_score || 0), 0) / devices.length) : 40;
  return days.map((day, i) => {
    const noise = (Math.sin(i * 2.1) * 10 + Math.cos(i * 0.8) * 6);
    const risk = Math.max(0, Math.min(100, Math.round(baseRisk + noise)));
    return {
      label: day,
      risk,
      kritik: Math.max(0, Math.round(devices.filter(d => d.status === "kritik").length * (0.7 + Math.sin(i) * 0.3))),
      anomali: Math.max(0, Math.round(devices.filter(d => d.status === "anomali").length * (0.8 + Math.cos(i) * 0.2))),
      uyari: Math.max(0, Math.round(devices.filter(d => d.status === "uyari").length * (0.9 + Math.sin(i * 0.5) * 0.1))),
    };
  });
}

function generateMonthlyData(devices) {
  const weeks = ["1. Hafta", "2. Hafta", "3. Hafta", "4. Hafta", "5. Hafta"];
  const baseRisk = devices.length > 0 ? Math.round(devices.reduce((s, d) => s + (d.risk_score || 0), 0) / devices.length) : 40;
  return weeks.map((week, i) => {
    const noise = (Math.sin(i * 1.5) * 15 + Math.cos(i * 2.3) * 8);
    const risk = Math.max(0, Math.min(100, Math.round(baseRisk + noise)));
    return {
      label: week,
      risk,
      kritik: Math.max(0, Math.round(devices.filter(d => d.status === "kritik").length * (0.6 + Math.sin(i * 0.7) * 0.4))),
      anomali: Math.max(0, Math.round(devices.filter(d => d.status === "anomali").length * (0.7 + Math.cos(i) * 0.3))),
      uyari: Math.max(0, Math.round(devices.filter(d => d.status === "uyari").length * (0.85 + Math.sin(i * 1.2) * 0.15))),
    };
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 shadow-2xl text-xs">
      <p className="text-muted-foreground font-mono text-[10px] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function TrendBadge({ data }) {
  if (data.length < 2) return null;
  const first = data[0].risk;
  const last = data[data.length - 1].risk;
  const diff = last - first;
  if (Math.abs(diff) < 2) return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Minus className="w-3 h-3" /> Stabil</span>;
  if (diff > 0) return <span className="flex items-center gap-1 text-xs text-rose-400"><TrendingUp className="w-3 h-3" /> +{diff} puan yükseliş</span>;
  return <span className="flex items-center gap-1 text-xs text-emerald-400"><TrendingDown className="w-3 h-3" /> {diff} puan düşüş</span>;
}

function PredictivePanel() {
  const { data = {} } = useQuery({
    queryKey: ["predictive"],
    queryFn: () => fetch("/api/predictive", {credentials:"include"}).then(r=>r.json()),
    refetchInterval: 300000,
  });
  const preds = data.predictions || [];
  const critical = preds.filter(p => p.risk_tahmini === "critical");
  const warning = preds.filter(p => p.risk_tahmini === "warning");
  const improving = preds.filter(p => p.risk_tahmini === "improving");

  const riskIcon = (r) => {
    if (r === "critical") return <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
    if (r === "warning") return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />;
    if (r === "improving") return <TrendingDown className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
    return <Minus className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />;
  };

  const riskBg = (r) => {
    if (r === "critical") return "bg-red-500/5 border-red-500/30";
    if (r === "warning") return "bg-yellow-500/5 border-yellow-500/30";
    if (r === "improving") return "bg-emerald-500/5 border-emerald-500/30";
    return "bg-slate-800/50 border-slate-700/50";
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden mb-4">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Activity className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold">🔮 Gelecek Hafta Risk Tahmini</h3>
        <span className="text-xs text-muted-foreground ml-auto">{preds.length} PC analiz edildi</span>
      </div>
      <div className="p-3">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 text-xs text-slate-400 mb-3">
          <span className="text-slate-300 font-semibold">Nasıl çalışır? </span>
          Geçen haftaki alarm sayısı, kritik olay oranı ve trend yönüne göre gelecek haftanın riski tahmin edilir.
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
            <div className="text-2xl font-black text-red-400">{critical.length}</div>
            <div className="text-xs text-red-400">Kritik Risk</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-center">
            <div className="text-2xl font-black text-yellow-400">{warning.length}</div>
            <div className="text-xs text-yellow-400">Uyarı</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 text-center">
            <div className="text-2xl font-black text-emerald-400">{improving.length}</div>
            <div className="text-xs text-emerald-400">İyileşiyor</div>
          </div>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {preds.map((p, i) => (
            <div key={i} className={`flex items-start gap-2 rounded-lg p-2 border ${riskBg(p.risk_tahmini)}`}>
              {riskIcon(p.risk_tahmini)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-foreground">{p.pc_name}</span>
                  <span className="text-[10px] text-muted-foreground">{p.gecen_hafta_alarm} alarm</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{p.tahmin_mesaj}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TrendAnalizTab({ devices }) {
  const [period, setPeriod] = useState("weekly");
  const data = period === "weekly" ? generateWeeklyData(devices) : generateMonthlyData(devices);
  const avgRisk = devices.length > 0 ? Math.round(devices.reduce((s, d) => s + (d.risk_score || 0), 0) / devices.length) : 0;
  const maxRisk = data.reduce((m, d) => Math.max(m, d.risk), 0);
  const minRisk = data.reduce((m, d) => Math.min(m, d.risk), 100);

  return (
    <div className="p-4 space-y-4">
      <PredictivePanel />
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Trend Analizi</h3>
          <TrendBadge data={data} />
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5 ${period === "weekly" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Calendar className="w-3 h-3" /> Haftalık
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5 ${period === "monthly" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Calendar className="w-3 h-3" /> Aylık
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Ort. Risk</p>
          <p className="text-2xl font-black text-foreground">{avgRisk}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">güncel ortalama</p>
        </div>
        <div className="bg-card border border-rose-500/20 rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Pik Risk</p>
          <p className="text-2xl font-black text-rose-400">{maxRisk}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">dönem içi max</p>
        </div>
        <div className="bg-card border border-emerald-500/20 rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Min Risk</p>
          <p className="text-2xl font-black text-emerald-400">{minRisk}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">dönem içi min</p>
        </div>
      </div>

      {/* Risk Skoru Trend Grafiği */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Risk Skoru Trendi — {period === "weekly" ? "Bu Hafta" : "Bu Ay"}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3a8f6f" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3a8f6f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "hsl(220,15%,38%)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(220,15%,38%)", fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />
            <ReferenceLine y={50} stroke="#d4913a" strokeDasharray="4 4" strokeOpacity={0.4} />
            <ReferenceLine y={80} stroke="#c0392b" strokeDasharray="4 4" strokeOpacity={0.4} />
            <Area type="monotone" dataKey="risk" stroke="#3a8f6f" strokeWidth={2.5} fill="url(#gRisk)" dot={{ r: 4, fill: "#3a8f6f", strokeWidth: 0 }} activeDot={{ r: 5 }} name="Risk Skoru" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="w-6 border-t border-dashed border-orange-400/50" /><span>Yüksek Eşik (50)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-6 border-t border-dashed border-rose-500/50" /><span>Kritik Eşik (80)</span></div>
        </div>
      </div>

      {/* Olay Tipi Trend */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Durum Dağılımı Trendi — {period === "weekly" ? "Bu Hafta" : "Bu Ay"}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "hsl(220,15%,38%)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(220,15%,38%)", fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />
            <Legend wrapperStyle={{ fontSize: "10px", color: "hsl(220,14%,46%)", paddingTop: "12px" }} />
            <Line type="monotone" dataKey="kritik" stroke="#c0392b" strokeWidth={2} dot={{ r: 3 }} name="Kritik" />
            <Line type="monotone" dataKey="anomali" stroke="#d4913a" strokeWidth={2} dot={{ r: 3 }} name="Anomali" />
            <Line type="monotone" dataKey="uyari" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} name="Uyarı" strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
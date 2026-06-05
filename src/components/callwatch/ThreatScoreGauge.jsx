import React, { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { ShieldAlert } from "lucide-react";

export default function ThreatScoreGauge({ devices, alarms }) {
  const [displayScore, setDisplayScore] = useState(0);

  const kritik = devices.filter(d => d.status === "kritik").length;
  const anomali = devices.filter(d => d.status === "anomali").length;
  const uyari = devices.filter(d => d.status === "uyari").length;
  const avgRisk = devices.length > 0
    ? devices.reduce((s, d) => s + (d.risk_score || 0), 0) / devices.length
    : 0;

  const score = Math.min(100, Math.round(
    (kritik * 25 + anomali * 12 + uyari * 5 + avgRisk * 0.4 + alarms * 3)
  ));

  useEffect(() => {
    let frame;
    const animate = () => {
      setDisplayScore(prev => {
        if (prev < score) { frame = requestAnimationFrame(animate); return Math.min(prev + 2, score); }
        if (prev > score) { frame = requestAnimationFrame(animate); return Math.max(prev - 2, score); }
        return prev;
      });
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const color = displayScore >= 70 ? "#ef4444" : displayScore >= 40 ? "#f59e0b" : "#3a8f6f";
  const label = displayScore >= 70 ? "KRİTİK" : displayScore >= 40 ? "ORTA" : "DÜŞÜK";
  const data = [{ value: displayScore, fill: color }];

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-1 self-start">
        <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Threat Score</p>
      </div>
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="65%" outerRadius="90%"
            startAngle={225} endAngle={-45}
            data={[{ value: 100, fill: "rgba(255,255,255,0.05)" }, ...data]}
            barSize={10}
          >
            <RadialBar background={false} dataKey="value" cornerRadius={6} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black tabular-nums" style={{ color }}>{displayScore}</span>
          <span className="text-[9px] font-bold tracking-widest mt-0.5" style={{ color }}>{label}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 w-full mt-2">
        <MiniStat label="Kritik" value={kritik} color="text-red-400" />
        <MiniStat label="Anomali" value={anomali} color="text-orange-400" />
        <MiniStat label="Uyarı" value={uyari} color="text-yellow-400" />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-black tabular-nums ${color}`}>{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}
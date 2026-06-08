import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { X, Monitor, User, Building2, Wifi, Usb, Activity, Clock, Shield, Zap } from "lucide-react";

export default function PCDetailModal({ device, onClose }) {
  const [pcData, setPcData] = useState(device);
  useEffect(() => {
    if (!device?.pc_name) return;
    fetch('/api/pc-names', {credentials:"include"})
      .then(r => r.json())
      .then(data => {
        const pc = (data.pc_names || []).find(p => p.pc_name === device.pc_name);
        if (pc) setPcData({...device, ...pc});
      })
      .catch(() => {});
  }, [device?.pc_name]);
  const d = pcData;
  if (!device) return null;

  const statusColor = {
    normal: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    uyari: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    anomali: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    kritik: "text-red-400 bg-red-400/10 border-red-400/20",
  }[device.status] || "text-slate-400";

  const riskColor = device.risk_score >= 80 ? "text-red-400" : device.risk_score >= 50 ? "text-yellow-400" : "text-emerald-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">{device.pc_name}</h2>
              <p className="text-[10px] text-muted-foreground">{device.ip_address || "IP bilinmiyor"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status row */}
          <div className="flex items-center gap-3">
            <Badge className={`text-xs border ${statusColor}`}>{device.status?.toUpperCase() || "NORMAL"}</Badge>
            {device.usb_connected && (
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs flex items-center gap-1">
                <Usb className="w-3 h-3" /> USB Bağlı
              </Badge>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={User} label="Kullanıcı" value={device.owner_name || "Atanmadı"} />
            <InfoRow icon={Building2} label="Departman" value={device.department || "—"} />
            <InfoRow icon={Clock} label="Vardiye" value={device.shift?.toUpperCase() || "—"} />
            <InfoRow icon={Wifi} label="IP Adresi" value={device.ip_address || "—"} />
            <InfoRow icon={Activity} label="Son Aktivite" value={device.last_activity ? new Date(device.last_activity).toLocaleString("tr-TR") : "—"} />
            <InfoRow icon={Clock} label="Boş Süre" value={device.idle_duration_minutes ? `${device.idle_duration_minutes} dk` : "—"} />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Risk Skoru" value={device.risk_score || 0} max={100} color={riskColor} icon={Shield} />
            <MetricCard label="IF Skoru" value={Math.round((device.if_score || 0) * 100)} max={100} color="text-blue-400" icon={Zap} />
          </div>

        </div>
      </div>
    </div>
  );
}


function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 bg-secondary/30 rounded-lg px-3 py-2.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-xs font-medium text-foreground mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, max, color, icon: MetricIcon }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = color === "text-blue-400" ? "#60a5fa" : color === "text-red-400" ? "#f87171" : "#3a8f6f";
  return (
    <div className="bg-secondary/30 rounded-lg px-3 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <MetricIcon className={`w-3.5 h-3.5 ${color}`} />
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
        <span className={`text-lg font-black tabular-nums ${color}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
}
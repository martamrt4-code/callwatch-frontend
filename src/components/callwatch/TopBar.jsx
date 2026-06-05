import React, { useState, useEffect } from "react";
import { Eye, RefreshCw, Shield, Wifi, LogOut, ChevronDown } from "lucide-react";
import { callwatch } from "@/api/callwatchClient";

export default function TopBar({ stats, onRefresh }) {
  const [time, setTime] = useState(new Date());
  const [user, setUser] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    callwatch.me().then(setUser).catch(() => {});
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = time.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="h-14 bg-[#090e1a] border-b border-white/5 flex items-center justify-between px-6 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#090e1a] animate-pulse" />
          </div>
          <div>
            <div
              className="text-sm font-black tracking-[0.2em] uppercase leading-none"
              style={{ background: "linear-gradient(90deg, #2dd4bf 0%, #818cf8 50%, #2dd4bf 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              OMNISIGHT
            </div>
            <div className="text-[9px] text-muted-foreground tracking-[0.15em] uppercase">Security Operations</div>
          </div>
        </div>

        {/* Stat Pills */}
        <div className="hidden md:flex items-center gap-2">
          <StatPill label="Toplam PC" value={stats.totalPC} dot="bg-sky-400" />
          <StatPill label="Normal" value={stats.normal} dot="bg-emerald-400" />
          <StatPill label="Uyarı" value={stats.uyari} dot="bg-yellow-400" />
          <StatPill label="Anomali" value={stats.anomali} dot="bg-rose-500" />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-5">
        {/* Live Indicator */}
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">Canlı</span>
        </div>

        {/* Date/Time */}
        <div className="text-right hidden sm:block">
          <div className="text-xs font-mono text-foreground leading-tight">{timeStr}</div>
          <div className="text-[10px] text-muted-foreground leading-tight">{dateStr}</div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* User */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary uppercase">
              {(user?.full_name || "A").charAt(0)}
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-foreground leading-tight">{user?.full_name || "Admin"}</div>
            <div className="text-[9px] text-muted-foreground leading-tight">{user?.role || "Yönetici"}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            className="w-7 h-7 rounded-md bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/30 transition-all flex items-center justify-center group"
            title="Yenile"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
          <button
            onClick={() => { fetch("/api/logout").then(() => window.location.href="/login") }}
            className="w-7 h-7 rounded-md bg-secondary/50 border border-border hover:bg-destructive/10 hover:border-destructive/30 transition-all flex items-center justify-center group"
            title="Çıkış"
          >
            <LogOut className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, dot }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors">
      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-[10px] font-bold text-foreground tabular-nums">{value}</span>
    </div>
  );
}
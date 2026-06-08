import React from "react";
import { Eye, BarChart3, Bell, GitBranch, Coffee, TreePine, List, FileText, RefreshCw, LogOut, Settings, Building2, TrendingUp, Globe, Calendar } from "lucide-react";
import { callwatch } from "@/api/callwatchClient";

const tabs = [
  // --- İzleme ---
  { id: "overview",       label: "Genel Bakış",        icon: BarChart3 },
  { id: "alarmlar",       label: "Alarmlar",            icon: Bell },
  { id: "webaktivite",    label: "Web Aktivite",        icon: Globe },
  { id: "olaylar",        label: "Son Olaylar",         icon: List },
  // --- Analiz ---
  { id: "risk",           label: "Risk & Korelasyon",   icon: GitBranch },
  { id: "trend",          label: "Trend Analizi",       icon: TrendingUp },
  { id: "departman",      label: "Departman Riski",     icon: Building2 },
  // --- Raporlar ---
  { id: "vardiya-raporu", label: "Vardiya Raporu",      icon: Calendar },
  { id: "aylik-risk",     label: "Aylık Risk Raporu",   icon: TrendingUp },
  { id: "audit",          label: "Audit Log",           icon: FileText },
  // --- Yönetim ---
  { id: "yonetici",       label: "Yönetici Paneli",     icon: Settings },
  { id: "pcyonetim",      label: "PC Yönetimi",         icon: Settings },
];

import { useAuth } from "@/lib/AuthContext";

export default function Sidebar({ activeTab, onTabChange, stats, onRefresh, user, isAdmin }) {
  const { logout } = useAuth();
  const visibleTabs = isAdmin 
    ? [...tabs, { id: "yonetici", label: "Yönetici Paneli", icon: Settings }]
    : tabs;

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-[#070c18] border-r border-white/[0.05] h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary border-2 border-[#070c18]" />
          </div>
          <div>
            <div className="text-sm font-black tracking-[0.18em] uppercase text-foreground leading-none">
              OMNISIGHT
            </div>
            <div className="text-[9px] text-muted-foreground tracking-wider uppercase mt-0.5">Security Ops</div>
          </div>
        </div>

        {/* Live badge */}
        <div className="flex items-center gap-1.5 mt-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-semibold text-primary tracking-widest uppercase">Canlı İzleme</span>
        </div>
      </div>

      {/* Stats summary */}
      <div className="px-4 py-3 border-b border-white/[0.05]">
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Sistem Özeti</p>
        <div className="space-y-1.5">
          <StatRow label="Toplam PC" value={stats.totalPC} color="text-slate-300" />
          <StatRow label="Normal" value={stats.normal} color="text-primary" />
          <StatRow label="Uyarı" value={stats.uyari} color="text-amber-500" />
          <StatRow label="Anomali" value={stats.anomali} color="text-red-500" />
          <StatRow label="Toplam Alarm" value={stats.totalAlarms} color="text-slate-400" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest px-2 mb-2">Modüller</p>
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all text-left ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
              <span>{tab.label}</span>
              {isActive && (
                <div className="ml-auto w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.05] space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-primary uppercase">
              {(user?.full_name || "A").charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-foreground truncate leading-tight">{user?.full_name || "Admin"}</div>
            <div className="text-[9px] text-muted-foreground leading-tight capitalize">{user?.role || "Yönetici"}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { onRefresh(); window.location.reload(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-all text-[10px] text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3 h-3" />
            Yenile
          </button>
          <button
            onClick={() => logout()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] hover:bg-red-500/10 hover:border-red-500/20 transition-all text-[10px] text-muted-foreground hover:text-red-400"
          >
            <LogOut className="w-3 h-3" />
            Çıkış
          </button>
        </div>
      </div>
    </aside>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={`text-[10px] font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
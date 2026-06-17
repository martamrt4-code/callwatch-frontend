import React from "react";
import { BarChart3, Bell, GitBranch, List, FileText, Building2, TrendingUp } from "lucide-react";

const tabs = [
  { id: "overview", label: "Genel Bakış", icon: BarChart3 },
  { id: "alarmlar", label: "Alarmlar", icon: Bell },
  { id: "risk", label: "Risk & Korelasyon", icon: GitBranch },
  { id: "olaylar", label: "Son Olaylar", icon: List },
  { id: "audit", label: "Audit Log", icon: FileText },
  { id: "departman", label: "Departman Riski", icon: Building2 },
  { id: "trend", label: "Trend Analizi", icon: TrendingUp },
];

export default function TabNav({ activeTab, onTabChange }) {
  return (
    <div className="flex items-center gap-0.5 px-6 pt-2 border-b border-white/5 bg-[#090e1a] overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium transition-all whitespace-nowrap rounded-t-md ${
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
import React from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export default function BestWorstPC({ devices }) {
  const sorted = [...devices].sort((a, b) => (a.risk_score || 0) - (b.risk_score || 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <div className="px-4 py-3">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-yellow-400">⭐</span> Haftalık En İyi / En Kötü PC
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            EN GÜVENLİ PC
          </div>
          <p className="text-foreground font-medium text-sm">{best?.pc_name || "—"}</p>
          <p className="text-muted-foreground text-xs">Risk Skoru: {best?.risk_score ?? "—"}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive text-xs font-semibold mb-1">
            <AlertTriangle className="w-4 h-4" />
            EN RİSKLİ PC
          </div>
          <p className="text-foreground font-medium text-sm">{worst?.pc_name || "—"}</p>
          <p className="text-muted-foreground text-xs">Risk Skoru: {worst?.risk_score ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
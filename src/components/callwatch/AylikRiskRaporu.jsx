import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle } from "lucide-react";

export default function AylikRiskRaporu() {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data = {}, isLoading } = useQuery({
    queryKey: ["aylik-risk"],
    queryFn: () => fetch("/api/aylik-risk", {credentials:"include"}).then(r=>r.json()),
    refetchInterval: 60000,
  });

  const risks = data.risk || [];
  const totalPages = Math.ceil(risks.length / PAGE_SIZE);
  const paged = risks.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const getRiskLevel = (puan, ihlal) => {
    if (puan < 85 || ihlal > 10) return { label: "Yüksek Risk", color: "text-red-400", bg: "bg-red-500/20" };
    if (puan < 92 || ihlal > 5) return { label: "Orta Risk", color: "text-yellow-400", bg: "bg-yellow-500/20" };
    return { label: "Düşük Risk", color: "text-emerald-400", bg: "bg-emerald-500/20" };
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Aylık Risk Raporu (Son 30 Gün)</h3>
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{risks.length} PC</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">PC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Risk</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Ort. Puan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Min Puan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Toplam İhlal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Yasak Site</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">USB</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Aktif Gün</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Günlük Detay</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Yükleniyor...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Kayıt yok</td></tr>
              ) : paged.map((r, i) => {
                const risk = getRiskLevel(r.ort_puan, r.toplam_ihlal);
                return (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-2 font-mono text-xs font-medium">{r.pc_name}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${risk.color} ${risk.bg}`}>
                        {risk.label}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-sm font-bold ${r.ort_puan >= 92 ? 'text-emerald-400' : r.ort_puan >= 85 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {r.ort_puan}/100
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{r.min_puan}/100</td>
                    <td className="px-4 py-2 text-xs text-center font-semibold">{r.toplam_ihlal}</td>
                    <td className="px-4 py-2 text-xs text-center">{r.yasak_site}</td>
                    <td className="px-4 py-2 text-xs text-center">{r.usb}</td>
                    <td className="px-4 py-2 text-xs text-center">{r.gun_sayisi}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground max-w-[300px] truncate" title={r.gunluk_detay}>{r.gunluk_detay}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{risks.length} PC / Sayfa {page}/{totalPages}</span>
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

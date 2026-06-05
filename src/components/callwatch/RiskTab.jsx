import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDisplayName } from "@/api/callwatchClient";
import { Badge } from "@/components/ui/badge";
import SearchInput from "./SearchInput";
import ExportButton from "./ExportButton";
import { AlertTriangle, Link, Shield } from "lucide-react";

export default function RiskTab() {
  const [search, setSearch] = useState("");
  const { data: riskData = {}, isLoading } = useQuery({
    queryKey: ["risk-scores-tab"],
    queryFn: () => fetch('/api/risk-scores',{credentials:'include'}).then(r=>r.json()),
    refetchInterval: 30000,
  });
  const { data: corrData = {} } = useQuery({
    queryKey: ["correlations"],
    queryFn: () => fetch('/api/correlations',{credentials:'include'}).then(r=>r.json()),
    refetchInterval: 60000,
  });

  const devices = (riskData.scores || []).sort((a,b) => b.score - a.score)
    .filter(d => !search || d.pc_name?.toLowerCase().includes(search.toLowerCase()));
  const correlations = corrData.correlations || [];
  const [corrPage, setCorrPage] = React.useState(1);
  const CORR_PAGE_SIZE = 5;
  const corrTotalPages = Math.ceil(correlations.length / CORR_PAGE_SIZE);
  const pagedCorr = correlations.slice((corrPage-1)*CORR_PAGE_SIZE, corrPage*CORR_PAGE_SIZE);

  const getRiskLevel = (score) => {
    if (score >= 80) return { label: "Kritik", className: "bg-destructive/20 text-destructive border-destructive/30" };
    if (score >= 50) return { label: "Yüksek", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    if (score >= 20) return { label: "Orta", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    return { label: "Düşük", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
  };

  return (
    <div className="p-4 space-y-4">

      {/* Korelasyon / Zincir Alarmlar */}
      {correlations.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Link className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-foreground">Olay Zinciri & Korelasyon</h3>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">{correlations.length}</Badge>
          </div>
          <div className="p-3 space-y-2">
            {/* Açıklama */}
            <div className="text-xs text-slate-400 bg-slate-800/50 rounded p-2 mb-3">
              <span className="text-slate-300 font-semibold">Korelasyon nedir? </span>
              Aynı PC'de kısa sürede birden fazla farklı ihlal türü tespit edildiğinde sistem bunları birbirine bağlar. 
              Tek başına önemsiz görünen olaylar birleşince ciddi risk oluşturabilir.
            </div>
            {pagedCorr.map((c, i) => (
              <div key={i} className={`rounded-lg p-3 border ${c.risk === 'critical' ? 'bg-red-500/5 border-red-500/30' : 'bg-yellow-500/5 border-yellow-500/30'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${c.risk === 'critical' ? 'text-red-400' : 'text-yellow-400'}`} />
                    <div>
                      <p className="text-xs text-slate-200">{c.description}</p>
                      {c.tipler && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {c.tipler.map((t, j) => (
                            <span key={j} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={`text-[10px] flex-shrink-0 ${c.risk === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                    {c.risk === 'critical' ? 'KRİTİK' : 'UYARI'}
                  </Badge>
                </div>
              </div>
            ))}
          {corrTotalPages > 1 && (
            <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-border">
              <span className="text-xs text-muted-foreground">{correlations.length} korelasyon / Sayfa {corrPage}/{corrTotalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setCorrPage(p => Math.max(1,p-1))} disabled={corrPage===1}
                  className="px-2 py-1 rounded text-xs border border-border hover:bg-secondary disabled:opacity-50">‹</button>
                <button onClick={() => setCorrPage(p => Math.min(corrTotalPages,p+1))} disabled={corrPage===corrTotalPages}
                  className="px-2 py-1 rounded text-xs border border-border hover:bg-secondary disabled:opacity-50">›</button>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Risk Skorları */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">PC Risk Skorları</h3>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{devices.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="PC ara..." />
            <ExportButton data={devices} filename="risk_skorlari" columns={[
              {label:"PC",key:"pc_name"},{label:"Skor",key:"score"},{label:"Alarm",key:"alarm_count"}
            ]} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">PC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Risk Skoru</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Seviye</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Alarm</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Vardiya</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Yükleniyor...</td></tr>
              ) : devices.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Veri yok</td></tr>
              ) : devices.map((device) => {
                const risk = getRiskLevel(device.score || 0);
                return (
                  <tr key={device.pc_name} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-xs">{device.pc_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${(device.score||0)>=80?'bg-destructive':(device.score||0)>=50?'bg-yellow-400':'bg-emerald-400'}`}
                            style={{width: (device.score||0)+'%'}} />
                        </div>
                        <span className="text-xs font-mono">{device.score||0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge className={`${risk.className} text-xs`}>{risk.label}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{device.alarm_count||0}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{device.shift||'—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

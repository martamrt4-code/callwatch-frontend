import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Coffee } from "lucide-react";
import SearchInput from "./SearchInput";
import ExportButton from "./ExportButton";

function formatTS(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("tr-TR", {
      month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
      timeZone: "Europe/Istanbul"
    });
  } catch { return ts.substring(5,16).replace("T"," "); }
}

export default function MolaTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data = {}, isLoading } = useQuery({
    queryKey: ["mola-gecmis"],
    queryFn: () => fetch("/api/mola-gecmis", {credentials:"include"}).then(r=>r.json()),
    refetchInterval: 30000,
  });

  const molalar = (data.molalar || []).filter(m =>
    !search || m.pc_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(molalar.length / PAGE_SIZE);
  const paged = molalar.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const getStatus = (status, desc) => {
    const isKisa = String(desc||'').includes('Kısa');
    const isUzun = String(desc||'').includes('Uzun');
    if (status === 'pending' && isKisa) return { label: "Kısa Mola", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    if (status === 'pending' && isUzun) return { label: "Uzun Mola", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
    if (status === 'pending') return { label: "Devam Ediyor", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    if (status === 'closed') return { label: "Bitti", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    return { label: status, className: "bg-secondary text-muted-foreground" };
  };

  const getSure = (desc) => {
    const match = String(desc || "").match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  return (
    <div className="p-4">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold">Mola Takibi</h3>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{molalar.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="PC ara..." />
            <ExportButton data={molalar} filename="mola-gecmis" columns={[
              {label:"Zaman",key:"ts"},{label:"PC",key:"pc_name"},{label:"Açıklama",key:"description"},{label:"Durum",key:"status"}
            ]} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Zaman</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">PC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Süre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Durum</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Not</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Yükleniyor...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Mola kaydı yok</td></tr>
              ) : paged.map((m) => {
                const sure = getSure(m.description);
                const st = getStatus(m.status, m.description);
                return (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{formatTS(m.ts)}</td>
                    <td className="px-4 py-2 font-mono text-xs font-medium">{m.pc_name}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-semibold ${sure >= 60 ? 'text-red-400' : sure >= 30 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        {sure} dk
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Badge className={`${st.className} text-xs`}>{st.label}</Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{m.review_note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{molalar.length} kayıt / Sayfa {page}/{totalPages}</span>
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

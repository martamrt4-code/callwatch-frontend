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

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { callwatch } from "@/api/callwatchClient";
import { Badge } from "@/components/ui/badge";
import SearchInput from "./SearchInput";
import ExportButton from "./ExportButton";

export default function SonOlaylarTab() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data: eventsData = {}, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => callwatch.events.list(),
    refetchInterval: 30000,
  });

  const events = Array.isArray(eventsData.events) ? eventsData.events : Array.isArray(eventsData) ? eventsData : [];
  const filtered = events.filter(e => {
    const matchSearch = !search || e.pc_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || e.event_type === typeFilter;
    return matchSearch && matchType;
  });

  const types = [...new Set(events.map(e => e.event_type).filter(Boolean))];
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <div className="p-4">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold">Son Olaylar <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">{filtered.length}</Badge></h3>
          <div className="flex items-center gap-2">
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
              className="bg-secondary border border-border text-foreground text-xs rounded px-2 py-1">
              <option value="">Tüm Tipler</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <SearchInput value={search} onChange={setSearch} placeholder="PC ara..." />
            <ExportButton data={filtered} filename="olaylar" columns={[
              {label:"Zaman",key:"ts"},{label:"PC",key:"pc_name"},{label:"Tip",key:"event_type"},{label:"Şiddet",key:"severity"}
            ]} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Zaman</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">PC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Tip</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Şiddet</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Kaynak</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Detay</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Yükleniyor...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Olay yok</td></tr>
              ) : paged.map((e,i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{formatTS(e.ts)}</td>
                  <td className="px-4 py-2 font-mono text-xs">{e.pc_name}</td>
                  <td className="px-4 py-2"><Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">{e.event_type}</Badge></td>
                  <td className="px-4 py-2"><Badge className={`text-xs ${e.severity==='critical'?'bg-destructive/20 text-destructive border-destructive/30':'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>{e.severity}</Badge></td>
                  <td className="px-4 py-2"><Badge className="bg-secondary text-muted-foreground text-xs">{e.source}</Badge></td>
                  <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">{typeof e.detail==='object'?JSON.stringify(e.detail).substring(0,80):String(e.detail||'').substring(0,80)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{filtered.length} olay / Sayfa {page}/{totalPages}</span>
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

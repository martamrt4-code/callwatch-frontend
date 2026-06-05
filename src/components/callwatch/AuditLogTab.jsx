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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { callwatch } from "@/api/callwatchClient";
import { Badge } from "@/components/ui/badge";

export default function AuditLogTab() {
  const { data: auditData = {}, isLoading } = useQuery({
    queryKey: ["audit-log"],
    queryFn: () => callwatch.audit.list(),
    refetchInterval: 30000,
  });

  const { data: closedData = {} } = useQuery({
    queryKey: ["closed-alarms"],
    queryFn: () => callwatch.alarms.closed(),
    refetchInterval: 30000,
  });

  const logs = auditData.logs || [];
  const [logPage, setLogPage] = useState(1);
  const [closedPage, setClosedPage] = useState(1);
  const PAGE = 20;
  const closed = closedData.alarms || [];
  const qc = useQueryClient();

  const reopenMutation = useMutation({
    mutationFn: (id) => fetch(`/api/alarms/${id}/status`, {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({status:'pending', note:'Geri alındı'})
    }).then(r=>r.json()),
    onSuccess: () => {
      qc.invalidateQueries(["closed-alarms"]);
      qc.invalidateQueries(["alarms-active"]);
    }
  });

  return (
    <div className="p-4 space-y-4">
      {/* Kapatılan Alarmlar */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold">✅ Kapatılan / FP Alarmlar <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{closed.length}</Badge></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">PC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Alarm</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Durum</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Kapatan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Not</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Zaman</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {closed.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Kayıt yok</td></tr>
              ) : closed.slice((closedPage-1)*PAGE, closedPage*PAGE).map((a,i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-4 py-2 font-mono text-xs">{a.pc_name}</td>
                  <td className="px-4 py-2 text-xs">{a.alarm_type}</td>
                  <td className="px-4 py-2"><Badge className={`text-xs ${a.status==='false_positive'?'bg-yellow-500/20 text-yellow-400':'bg-emerald-500/20 text-emerald-400'}`}>{a.status}</Badge></td>
                  <td className="px-4 py-2 text-xs">{a.reviewed_by||'—'}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{a.review_note||'—'}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{formatTS(a.reviewed_at)}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => reopenMutation.mutate(a.id)}
                      className="px-2 py-1 text-xs border border-orange-500/30 text-orange-400 rounded hover:bg-orange-500/20">
                      ↩ Geri Al
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Math.ceil(closed.length/PAGE) > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{closed.length} kayıt / Sayfa {closedPage}/{Math.ceil(closed.length/PAGE)}</span>
            <div className="flex gap-1">
              <button onClick={() => setClosedPage(p=>Math.max(1,p-1))} disabled={closedPage===1} className="px-2 py-1 text-xs border border-border rounded disabled:opacity-40 text-foreground">‹</button>
              <button onClick={() => setClosedPage(p=>Math.min(Math.ceil(closed.length/PAGE),p+1))} disabled={closedPage===Math.ceil(closed.length/PAGE)} className="px-2 py-1 text-xs border border-border rounded disabled:opacity-40 text-foreground">›</button>
            </div>
          </div>
        )}
      </div>
      {/* Audit Log */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold">🔍 Sistem Hareketleri <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">{logs.length}</Badge></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Zaman</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Kullanıcı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">İşlem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Hedef</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Detay</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">IP</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Yükleniyor...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Log yok</td></tr>
              ) : logs.slice((logPage-1)*PAGE, logPage*PAGE).map((l,i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{formatTS(l.ts)}</td>
                  <td className="px-4 py-2 text-xs text-primary">{l.username}</td>
                  <td className="px-4 py-2"><Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">{l.action}</Badge></td>
                  <td className="px-4 py-2 font-mono text-xs">{l.target}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{l.detail}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Math.ceil(logs.length/PAGE) > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{logs.length} kayıt / Sayfa {logPage}/{Math.ceil(logs.length/PAGE)}</span>
            <div className="flex gap-1">
              <button onClick={() => setLogPage(p=>Math.max(1,p-1))} disabled={logPage===1} className="px-2 py-1 text-xs border border-border rounded disabled:opacity-40 text-foreground">‹</button>
              <button onClick={() => setLogPage(p=>Math.min(Math.ceil(logs.length/PAGE),p+1))} disabled={logPage===Math.ceil(logs.length/PAGE)} className="px-2 py-1 text-xs border border-border rounded disabled:opacity-40 text-foreground">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

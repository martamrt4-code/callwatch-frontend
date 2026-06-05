import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Clock, CheckCircle, XCircle, AlertTriangle, BookOpen } from "lucide-react";

const ACTION_LABELS = {
  "alarm+log": "Alarm + Log",
  "alarm+log+notify": "Alarm + Bildirim",
  "alarm+log+notify+lock": "Alarm + Bildirim + Kilitle",
  "alarm+log+lock": "Alarm + Kilitle",
  "playbook": "Playbook",
};

export default function SoarPanel() {
  const [tab, setTab] = useState("kurallar");
  const qc = useQueryClient();

  const { data: rulesData = {} } = useQuery({
    queryKey: ["soar-rules"],
    queryFn: () => fetch("/api/soar-rules", {credentials:"include"}).then(r=>r.json()),
    refetchInterval: 30000,
  });

  const { data: logData = {} } = useQuery({
    queryKey: ["soar-log"],
    queryFn: () => fetch("/api/soar-log", {credentials:"include"}).then(r=>r.json()),
    refetchInterval: 15000,
  });

  const { data: approvalData = {} } = useQuery({
    queryKey: ["soar-approvals"],
    queryFn: () => fetch("/api/soar/pending-approvals", {credentials:"include"}).then(r=>r.json()),
    refetchInterval: 10000,
  });

  const { data: escalationData = {} } = useQuery({
    queryKey: ["soar-escalations"],
    queryFn: () => fetch("/api/soar/escalations", {credentials:"include"}).then(r=>r.json()),
    refetchInterval: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: (id) => fetch("/api/soar/approve", {method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body: JSON.stringify({id})}).then(r=>r.json()),
    onSuccess: () => qc.invalidateQueries({queryKey:["soar-approvals"]}),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => fetch("/api/soar/reject", {method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body: JSON.stringify({id})}).then(r=>r.json()),
    onSuccess: () => qc.invalidateQueries({queryKey:["soar-approvals"]}),
  });

  const rules = rulesData.rules || [];
  const logs = logData.log || [];
  const approvals = approvalData.approvals || [];
  const escalations = escalationData.escalations || [];

  const tabs = [
    { id: "kurallar", label: `Kurallar (${rules.length})` },
    { id: "approvals", label: `Onay Bekleyen (${approvals.length})`, alert: approvals.length > 0 },
    { id: "escalations", label: `Escalation (${escalations.length})` },
    { id: "gecmis", label: `Aksiyon Geçmişi (${logs.length})` },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">SOAR — Otomatik Müdahale Sistemi</h3>
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{rules.filter(r=>r.enabled).length} aktif kural</Badge>
          {approvals.length > 0 && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs animate-pulse">{approvals.length} onay bekliyor!</Badge>}
        </div>

        {/* Sekmeler */}
        <div className="flex border-b border-border">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-medium transition-colors relative ${tab===t.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
              {t.alert && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
          ))}
        </div>

        {/* Kurallar */}
        {tab === "kurallar" && (
          <div className="p-4 space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="border border-border rounded-lg p-3 hover:bg-secondary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                    <span className="text-sm font-semibold">{rule.name}</span>
                  </div>
                  <Badge className={`text-xs ${rule.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {rule.enabled ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400">Tetikleyici: {rule.trigger_type}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400">Eşik: {rule.trigger_threshold}x / {rule.trigger_window_minutes}dk</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-orange-500/10 text-orange-400">{ACTION_LABELS[rule.action_type] || rule.action_type}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Onay Bekleyenler */}
        {tab === "approvals" && (
          <div className="p-4 space-y-3">
            {approvals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Onay bekleyen aksiyon yok</div>
            ) : approvals.map(a => (
              <div key={a.id} className="border border-red-500/30 rounded-lg p-3 bg-red-500/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">{a.playbook_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.ts?.substring(5,16)}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">PC: <span className="text-foreground font-mono">{a.pc_name}</span></p>
                <p className="text-xs text-muted-foreground mb-3">Aksiyon: <span className="text-orange-400 font-semibold">{a.action}</span></p>
                <div className="flex gap-2">
                  <button onClick={() => approveMutation.mutate(a.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30">
                    <CheckCircle className="w-3 h-3" /> Onayla
                  </button>
                  <button onClick={() => rejectMutation.mutate(a.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30">
                    <XCircle className="w-3 h-3" /> Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Escalation */}
        {tab === "escalations" && (
          <div className="p-4 space-y-2">
            {escalations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Escalation kaydı yok</div>
            ) : escalations.map(e => (
              <div key={e.id} className="border border-orange-500/30 rounded-lg p-3 bg-orange-500/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-orange-400">Seviye {e.level}</span>
                  <span className="text-xs text-muted-foreground ml-2">{e.pc_name}</span>
                  <p className="text-xs text-foreground mt-1">{e.message}</p>
                </div>
                <span className="text-xs text-muted-foreground">{e.ts?.substring(5,16)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Aksiyon Geçmişi */}
        {tab === "gecmis" && (
          <div className="p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Henüz aksiyon yok</div>
            ) : logs.map(l => (
              <div key={l.id} className="border border-border/50 rounded-lg p-3 flex items-center justify-between hover:bg-secondary/20">
                <div>
                  <span className="text-xs font-semibold">{l.rule_name}</span>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">{l.pc_name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{l.trigger_detail}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">{l.ts?.substring(5,16)}</span>
                  <p className="text-xs text-emerald-400 mt-0.5">{l.action_result}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

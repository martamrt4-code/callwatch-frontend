import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Save } from "lucide-react";

const VARDIYAS = [
  { key: "genel", label: "Genel" },
  { key: "sabah", label: "Sabah" },
  { key: "oglen", label: "Öğle" },
  { key: "aksam", label: "Akşam" },
];

export default function PuanTablosu() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState({});
  const [vardiya, setVardiya] = useState("genel");

  const { data = {} } = useQuery({
    queryKey: ["puan-tablosu"],
    queryFn: () => fetch("/api/puan-tablosu", {credentials:"include"}).then(r=>r.json()),
  });

  const updateMutation = useMutation({
    mutationFn: ({key, value}) => fetch("/api/puan-tablosu/update", {
      method: "POST",
      credentials: "include",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({key, value})
    }).then(r=>r.json()),
    onSuccess: () => {
      qc.invalidateQueries(["puan-tablosu"]);
      setEditing({});
    }
  });

  const allItems = data.puan_tablosu || [];
  const items = allItems.filter(i => (i.vardiya || 'genel') === vardiya);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-semibold">Puan Tablosu Ayarları</h3>
      </div>
      <div className="flex border-b border-border">
        {VARDIYAS.map(v => (
          <button key={v.key} onClick={() => setVardiya(v.key)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${vardiya === v.key ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {v.label}
          </button>
        ))}
      </div>
      <div className="p-3 bg-slate-800/50 border-b border-border text-xs text-slate-400">
        <span className="text-slate-300 font-semibold">Nasıl çalışır? </span>
        Her PC 100 puan ile başlar. İhlaller tespit edildiğinde puan düşer.
      </div>
      <div className="divide-y divide-border">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20">
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{item.label}</div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs text-muted-foreground">-</span>
              <input
                type="number" min="0" max="100"
                value={editing[item.key] !== undefined ? editing[item.key] : item.value}
                onChange={e => setEditing({...editing, [item.key]: parseInt(e.target.value) || 0})}
                className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs text-center"
              />
              <span className="text-xs text-muted-foreground">puan</span>
              {editing[item.key] !== undefined && editing[item.key] !== item.value && (
                <button
                  onClick={() => updateMutation.mutate({key: item.key, value: editing[item.key]})}
                  disabled={updateMutation.isPending}
                  className="px-2 py-1 rounded text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">
                  <Save className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

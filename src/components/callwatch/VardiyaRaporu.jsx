import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, AlertTriangle, Download } from "lucide-react";

function PdfDownloadButton() {
  const [loading, setLoading] = useState(false);
  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/report/pdf?period=vardiya", { credentials: "include" });
      if (!res.ok) throw new Error("Sunucu hatası");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `callwatch_vardiya_raporu_${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      alert("İndirme başarısız: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  return (
    <button onClick={handleClick} disabled={loading}
      className="px-3 py-1 rounded text-xs border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 flex items-center gap-1 disabled:opacity-50">
      {loading ? "⏳ Hazırlanıyor..." : "📄 PDF İndir"}
    </button>
  );
}

const VARDIYA_LABELS = { sabah: "🌅 Sabah", oglen: "☀️ Öğle", gece: "🌙 Gece" };
const VARDIYA_COLORS = { sabah: "text-yellow-400", oglen: "text-orange-400", gece: "text-blue-400" };

export default function VardiyaRaporu() {
  const [vardiyaFilter, setVardiyaFilter] = useState("tumu");
  const [ayFilter, setAyFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data = {}, isLoading } = useQuery({
    queryKey: ["daily-scores"],
    queryFn: () => fetch("/api/daily-scores", {credentials:"include"}).then(r=>r.json()),
    refetchInterval: 60000,
  });

  const scores = data.scores || [];
  const filtered = scores
    .filter(s => vardiyaFilter === "tumu" || s.vardiya === vardiyaFilter)
    .filter(s => !ayFilter || s.tarih?.startsWith(ayFilter));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  // İstatistikler
  const stats = {
    sabah: scores.filter(s => s.vardiya === "sabah"),
    oglen: scores.filter(s => s.vardiya === "oglen"),
    gece: scores.filter(s => s.vardiya === "gece"),
  };

  return (
    <div className="p-4 space-y-4">
      {/* Vardiya özet kartları */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(stats).map(([v, items]) => (
          <div key={v} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-semibold ${VARDIYA_COLORS[v]}`}>{VARDIYA_LABELS[v]}</span>
              <Badge className="text-xs bg-secondary">{items.length} kayıt</Badge>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {items.length > 0 ? Math.round(items.reduce((s,i) => s+i.puan, 0)/items.length) : 100}
            </div>
            <div className="text-xs text-muted-foreground">ort. puan</div>
            <div className="text-xs text-red-400 mt-1">
              {items.reduce((s,i) => s+(i.toplam_ihlal||0), 0)} toplam ihlal
            </div>
          </div>
        ))}
      </div>

      {/* Tablo */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Vardiya Bazlı Günlük Puanlar</h3>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{filtered.length}</Badge>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => {
              const rows = filtered.map(s => `${s.tarih},${s.pc_name},${s.vardiya},${s.puan},${s.ihlal_sayisi||0},${(s.anomaly_score*100).toFixed(0)}%`).join("\n");
              const csv = "Tarih,PC,Vardiya,Puan,İhlal,Anomali\n" + rows;
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
              a.download = `vardiya-raporu-${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
            }} className="px-3 py-1 rounded text-xs border border-border hover:bg-secondary flex items-center gap-1">
              <Download className="w-3 h-3" /> CSV İndir
            </button>
            <PdfDownloadButton />
            <input type="month" value={ayFilter} onChange={e => setAyFilter(e.target.value)}
              className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground" />
            {["tumu","sabah","oglen","gece"].map(v => (
              <button key={v} onClick={() => { setVardiyaFilter(v); setPage(1); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${vardiyaFilter===v ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                {v === "tumu" ? "Tümü" : VARDIYA_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Tarih</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">PC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Vardiya</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Puan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">İhlal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Anomali</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Detay</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Yükleniyor...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Kayıt yok</td></tr>
              ) : paged.map((s,i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{s.tarih}</td>
                  <td className="px-4 py-2 font-mono text-xs">{s.pc_name}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-medium ${VARDIYA_COLORS[s.vardiya]}`}>
                      {VARDIYA_LABELS[s.vardiya] || s.vardiya}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-sm font-bold ${s.puan >= 70 ? 'text-emerald-400' : s.puan >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {s.puan}/100
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-center">{s.toplam_ihlal}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${s.anomaly_score*100}%`, background: s.anomaly_score > 0.9 ? '#ef4444' : s.anomaly_score > 0.6 ? '#eab308' : '#22c55e'}} />
                      </div>
                      <span className="text-xs text-muted-foreground">{(s.anomaly_score*100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">{s.detay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{filtered.length} kayıt / Sayfa {page}/{totalPages}</span>
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

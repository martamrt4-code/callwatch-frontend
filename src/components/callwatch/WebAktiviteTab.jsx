import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { callwatch } from "@/api/callwatchClient";
import { Badge } from "@/components/ui/badge";
import { Globe, AlertTriangle, ShieldAlert, TrendingUp, Search } from "lucide-react";
import ExportButton from "./ExportButton";

const CATEGORY_META = {
  normal:         { label: "Normal",          color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  sosyal:         { label: "Sosyal",          color: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  video:          { label: "Video",            color: "bg-purple-500/15 text-purple-400 border-purple-500/25" },
  mesajlasma:     { label: "Mesajlaşma",       color: "bg-red-500/15 text-red-400 border-red-500/25" },
  cloud_upload:   { label: "Cloud Upload",     color: "bg-purple-500/15 text-purple-400 border-purple-500/25" },
  dosya:          { label: "Dosya",            color: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
  oyun:           { label: "Oyun",             color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
  diger:          { label: "Diğer",            color: "bg-slate-500/15 text-slate-400 border-slate-500/25" },
};

const RISK_META = {
  low:      { label: "Düşük",  color: "text-emerald-400" },
  medium:   { label: "Orta",   color: "text-yellow-400" },
  high:     { label: "Yüksek", color: "text-orange-400" },
  critical: { label: "Kritik", color: "text-red-400" },
  dusuk:    { label: "Düşük",  color: "text-emerald-400" },
  orta:     { label: "Orta",   color: "text-yellow-400" },
  yuksek:   { label: "Yüksek", color: "text-orange-400" },
  kritik:   { label: "Kritik", color: "text-red-400" },
};

const BLACKLIST_DOMAINS = ["torrents.com", "4chan.org", "darkweb.onion", "proxysite.net", "casino.com", "bet365.com", "vpngate.net"];

const SIM_DOMAINS = [
  { domain: "facebook.com",    category: "sosyal_medya",   risk_level: "orta",   blocked: false },
  { domain: "instagram.com",   category: "sosyal_medya",   risk_level: "orta",   blocked: false },
  { domain: "bet365.com",      category: "kumar",          risk_level: "kritik", blocked: true },
  { domain: "vpngate.net",     category: "proxy_vpn",      risk_level: "yuksek", blocked: true },
  { domain: "google.com",      category: "normal",         risk_level: "dusuk",  blocked: false },
  { domain: "youtube.com",     category: "sosyal_medya",   risk_level: "dusuk",  blocked: false },
  { domain: "wetransfer.com",  category: "veri_sizintisi", risk_level: "yuksek", blocked: false },
  { domain: "proxysite.net",   category: "proxy_vpn",      risk_level: "kritik", blocked: true },
  { domain: "github.com",      category: "normal",         risk_level: "dusuk",  blocked: false },
  { domain: "mega.nz",         category: "veri_sizintisi", risk_level: "yuksek", blocked: false },
];

// Simüle veri — Teramind API bağlandığında burası entity'den gelecek
function useWebEvents() {
  const { data: rawDevices = {} } = useQuery({
    queryKey: ["pc-devices"],
    queryFn: () => callwatch.events.list(),
    staleTime: 60000,
  });
  const devices = Array.isArray(rawDevices.events) ? rawDevices.events : Array.isArray(rawDevices) ? rawDevices : [];

  const { data: rawEvents = {} } = useQuery({
    queryKey: ["browsing-events"],
    queryFn: () => callwatch.events.list(),
    staleTime: 30000,
  });
  const dbEvents = Array.isArray(rawEvents.events) ? rawEvents.events : Array.isArray(rawEvents) ? rawEvents : [];

  if (dbEvents.length === 0 && devices.length > 0) {
    const now = new Date();
    const sampleDevices = devices.slice(0, 50); // 400 PC'de demo verisi patlamasın
    return sampleDevices.flatMap((d, di) =>
      SIM_DOMAINS.slice(0, 4).map((s, si) => ({
        id: `sim-${di}-${si}`,
        pc_name: d.pc_name,
        owner_name: d.owner_name || "—",
        department: d.department || "—",
        url: `https://${s.domain}/page${si}`,
        domain: s.domain,
        category: s.category,
        risk_level: normalizeRisk(s.risk_level),
        blocked: s.blocked,
        duration_seconds: 30 + si * 45,
        timestamp: new Date(now - (si + di * 3) * 3600000).toISOString(),
      }))
    );
  }
  return dbEvents;
}

const PAGE_SIZE = 50;

function normalizeRisk(r) {
  if (!r) return "dusuk";
  const v = r.toLowerCase();
  if (v === "critical" || v === "kritik") return "kritik";
  if (v === "high" || v === "yuksek") return "yuksek";
  if (v === "medium" || v === "orta") return "orta";
  return "dusuk";
}

export default function WebAktiviteTab() {
  const { data: waData = {} } = useQuery({
    queryKey: ["web-activity"],
    queryFn: () => callwatch.webActivity(),
    refetchInterval: 30000,
  });

  const totalZiyaret = waData.total || 0;
  const engellenen = waData.blocked || 0;
  const kritik = waData.critical || 0;
  const topRiskliKullanicilar = (waData.top_pcs || []).map((p,i) => ({
    rank: i+1, user: p.pc_name, violations: p.count, score: Math.min(100, p.count * 5)
  }));
  const activities = (waData.activities || []).map(a => ({
    pc_name: a.pc_name,
    domain: a.domain,
    category: a.category || 'diger',
    risk_level: normalizeRisk(a.risk_level),
    blocked: a.status === 'closed',
    ts: a.ts,
  }));
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [onlyBlacklist, setOnlyBlacklist] = useState(false);
  const [page, setPage] = useState(1);

  const events = useWebEvents();
  if (!Array.isArray(events)) return <div className="p-8 text-muted-foreground text-center">Yükleniyor...</div>;

  const filtered = events.filter(e => {
    if (search && !e.pc_name?.toLowerCase().includes(search.toLowerCase()) &&
        !e.domain?.toLowerCase().includes(search.toLowerCase()) &&
        !e.owner_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter !== "all" && e.category !== catFilter) return false;
    if (riskFilter !== "all" && e.risk_level !== riskFilter) return false;
    if (onlyBlacklist && !e.blocked && !BLACKLIST_DOMAINS.includes(e.domain)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Filtre değişince sayfayı sıfırla
  useEffect(() => setPage(1), [search, catFilter, riskFilter, onlyBlacklist]);

  // Risk skoru en yüksek kullanıcılar
  const userRisk = {};
  events.forEach(e => {
    const key = e.pc_name;
    if (!userRisk[key]) userRisk[key] = { pc_name: e.pc_name, owner_name: e.owner_name, department: e.department, score: 0, violations: 0 };
    const w = { dusuk: 1, orta: 3, yuksek: 7, kritik: 15 }[e.risk_level] || 0;
    userRisk[key].score += w;
    if (e.blocked || e.risk_level === "kritik" || e.risk_level === "yuksek") userRisk[key].violations++;
  });
  const topRisk = Object.values(userRisk).sort((a, b) => b.score - a.score).slice(0, 5);

  const totalBlocked = events.filter(e => e.blocked).length;
  const totalCritical = events.filter(e => e.risk_level === "kritik").length;
  const totalEvents = events.length;

  return (
    <div className="p-5 space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        <KpiMini icon={Globe} label="Toplam Ziyaret" value={totalEvents} color="text-slate-300" bg="bg-slate-300/8" />
        <KpiMini icon={ShieldAlert} label="Engellenen Site" value={totalBlocked} color="text-red-400" bg="bg-red-400/10" />
        <KpiMini icon={AlertTriangle} label="Kritik Girişim" value={totalCritical} color="text-orange-400" bg="bg-orange-400/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sol: En Riskli Kullanıcılar */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-red-400" />
            <p className="text-xs font-semibold text-foreground">En Riskli Kullanıcılar</p>
          </div>
          {topRisk.length === 0 ? (
            <p className="text-xs text-muted-foreground">Veri yok</p>
          ) : topRisk.map((u, i) => (
            <div key={u.pc_name} className="flex items-center gap-3">
              <span className={`text-[10px] font-bold w-4 ${i === 0 ? "text-red-400" : "text-muted-foreground"}`}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{u.owner_name || u.pc_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{u.department} — {u.violations} ihlal</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-bold ${u.score > 50 ? "text-red-400" : u.score > 20 ? "text-orange-400" : "text-yellow-400"}`}>{u.score}</p>
                <p className="text-[9px] text-muted-foreground">puan</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sağ: Olay Tablosu */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          {/* Filtreler */}
          <div className="p-3 border-b border-border flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2.5 py-1.5 flex-1 min-w-[140px]">
              <Search className="w-3 h-3 text-muted-foreground shrink-0" />
              <input
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
                placeholder="PC, kullanıcı, domain..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <button
              onClick={() => setOnlyBlacklist(v => !v)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all ${onlyBlacklist ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}
            >
              Sadece Kara Liste
            </button>
            <ExportButton
              data={filtered}
              filename="web_aktivite"
              columns={[
                { label: "PC", key: "pc_name" },
                { label: "Kullanıcı", key: "owner_name" },
                { label: "Domain", key: "domain" },
                { label: "Kategori", key: "category" },
                { label: "Risk", key: "risk_level" },
                { label: "Engellendi", key: "blocked" },
                { label: "Süre (sn)", key: "duration_seconds" },
                { label: "Zaman", key: "timestamp" },
              ]}
            />
          </div>

          {/* Sayfalama bilgisi */}
          {totalPages > 1 && (
            <div className="px-3 py-2 border-b border-border flex items-center justify-between text-[10px] text-muted-foreground bg-background/50">
              <span>{filtered.length} kayıt — Sayfa {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-2 py-0.5 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >← Önceki</button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-2 py-0.5 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >Sonraki →</button>
              </div>
            </div>
          )}

          {/* Tablo */}
          <div className="overflow-auto max-h-[420px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">PC / Kullanıcı</th>
                  <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Domain</th>
                  <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Kategori</th>
                  <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Risk</th>
                  <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Süre</th>
                  <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Zaman</th>
                  <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">Kayıt bulunamadı</td></tr>
                ) : paginated.map((e, i) => {
                  const cat = CATEGORY_META[e.category] || CATEGORY_META.diger;
                  const risk = RISK_META[e.risk_level] || RISK_META.dusuk;
                  const isBlacklisted = e.blocked || BLACKLIST_DOMAINS.includes(e.domain);
                  return (
                    <tr key={e.id || i} className={`border-b border-border/40 hover:bg-white/[0.02] transition-colors ${isBlacklisted ? "bg-red-500/[0.03]" : ""}`}>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-foreground">{e.pc_name}</p>
                        <p className="text-[10px] text-muted-foreground">{e.owner_name}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-mono text-foreground">{e.domain}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{e.department}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge className={`${cat.color} text-[10px] border`}>{cat.label}</Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`font-semibold ${risk.color}`}>{risk.label}</span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {e.duration_seconds ? `${Math.round(e.duration_seconds / 60)}dk` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground font-mono text-[10px]">
                        {e.timestamp ? new Date(e.timestamp).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        {isBlacklisted ? (
                          <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[10px] border">⛔ Engellendi</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] border">✓ İzin Verildi</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiMini({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-xl font-black text-foreground tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
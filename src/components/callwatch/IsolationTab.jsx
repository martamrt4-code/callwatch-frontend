import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { TreePine } from "lucide-react";
import PCDetailModal from "./PCDetailModal";
import SearchInput from "./SearchInput";
import ExportButton from "./ExportButton";

export default function IsolationTab({ devices: devicesProp = [] }) {
  const { data: ifData = {}, isLoading } = useQuery({
    queryKey: ["if-results-tab"],
    queryFn: () => fetch('/api/if-results', {credentials:'include'}).then(r=>r.json()),
    refetchInterval: 30000,
  });
  
  const devices = (ifData.results || []).map(r => ({
    id: r.pc_name,
    pc_name: r.pc_name,
    owner_name: "",
    shift: r.shift,
    department: r.department,
    if_score: r.if_score || 0,
    if_label: r.if_label || 'NORMAL',
    status: r.risk === 'crit' ? 'anomali' : r.risk === 'warn' ? 'uyari' : 'normal',
    usb_connected: r.usb_event_count > 0,
  }));
  const [search, setSearch] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(null);
  const filteredDevices = devices.filter(d =>
    !search || d.pc_name?.toLowerCase().includes(search.toLowerCase()) || d.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getScoreColor = (score) => {
    if (score >= 0.7) return "text-destructive";
    if (score >= 0.4) return "text-yellow-400";
    return "text-emerald-400";
  };

  return (
    <div className="p-4">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <TreePine className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Isolation Forest — Anomali Skorları</h3>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{filteredDevices.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="PC, kullanıcı..." />
            <ExportButton data={filteredDevices} filename="isolation_raporu" columns={[
              { label: "PC Adı", key: "pc_name" }, { label: "Kullanıcı", key: "owner_name" },
              { label: "IF Skoru", key: "if_score" }, { label: "Durum", key: "status" }, { label: "USB", key: "usb_connected" }
            ]} />
          </div>
        </div>
        {selectedDevice && <PCDetailModal device={selectedDevice} onClose={() => setSelectedDevice(null)} />}
        
        {/* Anomali Hesaplama Açıklaması */}
        <div className="mx-4 mt-4 mb-2 bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
          <div className="text-xs font-bold text-slate-300 mb-2">📊 Anomali Skoru Nasıl Hesaplanıyor?</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-400">
            <div className="bg-slate-700/30 rounded p-2">
              <div className="text-emerald-400 font-semibold mb-1">🟢 Normal (0.0 – 0.4)</div>
              <div>Çalışan, gruptaki diğer kişilerle benzer davranış sergiliyor. Alarm sayısı, mola süresi ve web aktivitesi grup ortalamasına yakın.</div>
            </div>
            <div className="bg-slate-700/30 rounded p-2">
              <div className="text-yellow-400 font-semibold mb-1">🟡 Uyarı (0.4 – 0.7)</div>
              <div>Çalışanın bazı metrikleri gruptan belirgin şekilde ayrışıyor. Yakın takip gerektirir ancak kesin ihlal sayılmaz.</div>
            </div>
            <div className="bg-slate-700/30 rounded p-2">
              <div className="text-red-400 font-semibold mb-1">🔴 Anomali (0.7+)</div>
              <div>Çalışan alarm sayısı, yasak site erişimi, USB kullanımı veya mola süresi açısından gruptan çok belirgin şekilde ayrışıyor.</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            📌 Karşılaştırma kriterleri: <span className="text-slate-400">Toplam alarm sayısı · Yasak site erişim sıklığı · USB olayları · Mola süresi · Teramind alert sayısı</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">PC ADI</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">KULLANICI</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">VARDİYE</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">DEPARTMAN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">IF SKORU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">DURUM</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">USB</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Yükleniyor...</td></tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setSelectedDevice(device)}>
                    <td className="px-4 py-3 text-foreground font-medium hover:text-primary transition-colors">{device.pc_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{device.owner_name || <span className="italic opacity-40">Atanmadı</span>}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{device.shift || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{device.department || "—"}</td>
                    <td className={`px-4 py-3 font-mono font-semibold ${getScoreColor(device.if_score || 0)}`}>
                      {(device.if_score || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${
                        device.status === "normal" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                        device.status === "uyari" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                        "bg-destructive/20 text-destructive border-destructive/30"
                      }`}>{device.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {device.usb_connected ? (
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">Bağlı</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
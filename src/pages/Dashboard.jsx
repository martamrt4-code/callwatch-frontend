import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { callwatch } from "@/api/callwatchClient";
import { teramind } from "@/api/teramindClient";
import Sidebar from "@/components/callwatch/Sidebar";
import OverviewTab from "@/components/callwatch/OverviewTab";
import AlarmlarTab from "@/components/callwatch/AlarmlarTab";
import RiskTab from "@/components/callwatch/RiskTab";
import MolaTab from "@/components/callwatch/MolaTab";
import IsolationTab from "@/components/callwatch/IsolationTab";
import SonOlaylarTab from "@/components/callwatch/SonOlaylarTab";
import AuditLogTab from "@/components/callwatch/AuditLogTab";
import PCYonetimTab from "@/components/callwatch/PCYonetimTab";
import NotificationBell from "@/components/callwatch/NotificationBell";
import DepartmanRiskTab from "@/components/callwatch/DepartmanRiskTab";
import TrendAnalizTab from "@/components/callwatch/TrendAnalizTab";
import IFSkorGecmisiTab from "@/components/callwatch/IFSkorGecmisiTab";
import YoneticiPaneliTab from "@/components/callwatch/YoneticiPaneliTab";
import WebAktiviteTab from "@/components/callwatch/WebAktiviteTab";
import ScreenshotGallery from "@/components/callwatch/ScreenshotGallery";
import VardiyaRaporu from "@/components/callwatch/VardiyaRaporu";
import AylikRiskRaporu from "@/components/callwatch/AylikRiskRaporu";

const TAB_LABELS = {
  screenshots: "Ekran Görüntüleri",
  overview: "Genel Bakış", alarmlar: "Alarmlar", risk: "Risk & Korelasyon",
  mola: "Mola Takibi", isolation: "Isolation Forest", olaylar: "Son Olaylar",
  audit: "Audit Log", pcyonetim: "PC Yönetimi", departman: "Departman Riski",
  trend: "Trend Analizi", ifskor: "IF Skor Geçmişi", webaktivite: "Web Aktivite",
  yonetici: "Yönetici Paneli",
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [time, setTime] = useState(new Date());
  const queryClient = useQueryClient();
  const { data: alarmsData = {} } = useQuery({
    queryKey: ["alarms-notif"],
    queryFn: () => fetch('/api/alarms', {credentials:'include'}).then(r=>r.json()),
    refetchInterval: 15000,
  });
  const activeAlarms = (alarmsData.alarms || []).filter(a => a.status === 'pending' && a.alarm_type !== 'mola');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: ifData = {}, isLoading: loadingDevices, error: devicesError } = useQuery({
    queryKey: ["if-results"],
    queryFn: () => fetch("/api/if-results", {credentials:"include"}).then(r=>r.json()),
    staleTime: 30000,
    retry: 2,
  });
  const { data: pcNamesData = {} } = useQuery({
    queryKey: ["pc-names-dash"],
    queryFn: () => fetch("/api/pc-names", {credentials:"include"}).then(r=>r.json()),
    staleTime: 60000,
  });
  const ifResults = ifData.results || [];
  const pcNames = pcNamesData.pc_names || [];
  const enrichedDevices = pcNames.map((pc) => {
    const ifResult = ifResults.find((r) => r.pc_name === pc.pc_name) || {};
    const risk = ifResult.risk || "normal";
    const status = risk === "crit" ? "anomali" : risk === "warn" ? "uyari" : "normal";
    return { ...pc, id: pc.pc_name, status, if_score: ifResult.if_score || 0, owner_name: pc.owner_name || "" };
  });

  const stats = {
    totalPC: enrichedDevices.length,
    anomali: enrichedDevices.filter((d) => d.status === "anomali").length,
    uyari: enrichedDevices.filter((d) => d.status === "uyari").length,
    normal: enrichedDevices.filter((d) => d.status === "normal").length,
    totalEvents: 0,
    totalAlarms: 0,
  };

  const handleRefresh = () => { queryClient.invalidateQueries(); };

  const renderTab = () => {
    switch (activeTab) {
      case "overview":    return <OverviewTab stats={stats} devices={enrichedDevices} />;
      case "alarmlar":    return <AlarmlarTab />;
      case "risk":        return <RiskTab devices={enrichedDevices} />;
      case "mola":        return <MolaTab devices={enrichedDevices} />;
      case "olaylar":     return <SonOlaylarTab />;
      case "audit":       return <AuditLogTab />;
      case "pcyonetim":   return <PCYonetimTab />;
      case "departman":   return <DepartmanRiskTab devices={enrichedDevices} />;
      case "trend":       return <TrendAnalizTab devices={enrichedDevices} />;
      case "webaktivite": return <WebAktiviteTab />;
      case "yonetici":    return <YoneticiPaneliTab />;
      case "screenshots":  return <ScreenshotGallery />;
      case "vardiya-raporu": return <VardiyaRaporu />;
      case "aylik-risk": return <AylikRiskRaporu />;
      default:            return <OverviewTab stats={stats} devices={enrichedDevices} />;
    }
  };

  const timeStr = time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = time.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} stats={stats} onRefresh={handleRefresh} user={{ full_name: "Admin", role: "Yönetici" }} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 shrink-0 bg-[#070c18] border-b border-white/[0.05] flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h1 className="text-sm font-semibold text-foreground">{TAB_LABELS[activeTab]}</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {loadingDevices && <span className="text-primary animate-pulse">Yükleniyor...</span>}
            {devicesError && <span className="text-yellow-500/60 text-[10px]">Teramind bağlantısı yok</span>}
            {!loadingDevices && !devicesError && <span className="text-emerald-400">{enrichedDevices.length} PC bağlı</span>}
            <span className="font-mono">{timeStr}</span>
            <span className="hidden sm:block">{dateStr}</span>
            <NotificationBell alarms={activeAlarms} />
          </div>
        </header>
        <main className="flex-1 overflow-auto">{renderTab()}</main>
      </div>
    </div>
  );
}

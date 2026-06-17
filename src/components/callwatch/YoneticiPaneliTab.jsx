import React, { useState, useEffect } from "react";
import { callwatch } from "@/api/callwatchClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Users, Sliders, Shield, Save, RefreshCw, Trash2, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import SoarPanel from "./SoarPanel";
import PuanTablosu from "./PuanTablosu";
const SECTIONS = ["Eşik Değerleri", "Kullanıcılar", "Sistem Ayarları", "SOAR Kuralları", "Puan Tablosu", "Blacklist"];

const DEFAULT_THRESHOLDS = {
  risk_kritik: 80,
  risk_uyari: 50,
  if_kritik: 0.70,
  if_uyari: 0.40,
  idle_uzun: 30,
  idle_kisa: 15,
};

export default function YoneticiPaneliTab() {
  const [section, setSection] = useState("Eşik Değerleri");
  const [newDomain, setNewDomain] = useState("");
  const [newCategory, setNewCategory] = useState("mesajlasma");
  const [newSeverity, setNewSeverity] = useState("critical");

  const { data: blacklistData = {}, refetch: refetchBL } = useQuery({
    queryKey: ["blacklist"],
    queryFn: () => fetch("/api/blacklist", {credentials:"include"}).then(r=>r.json()),
  });

  const addDomainMutation = useMutation({
    mutationFn: (d) => fetch("/api/blacklist/add", {method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body: JSON.stringify(d)}).then(r=>r.json()),
    onSuccess: () => { refetchBL(); setNewDomain(""); }
  });

  const removeDomainMutation = useMutation({
    mutationFn: (domain) => fetch("/api/blacklist/remove", {method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body: JSON.stringify({domain})}).then(r=>r.json()),
    onSuccess: () => refetchBL(),
  });
  const isSoar = section === "SOAR Kuralları";
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  // DB'den ayarları yükle
  const { data: settingsData = {} } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetch('/api/settings',{credentials:'include'}).then(r=>r.json()),
  });

  const [initialized, setInitialized] = React.useState(false);
  useEffect(() => {
    if (initialized) return;
    const s = settingsData.settings || {};
    if (Object.keys(s).length > 0) {
      setInitialized(true);
      setThresholds(t => ({
        ...t,
        idle_kisa: s.idle_short ? parseInt(s.idle_short) : t.idle_kisa,
        idle_uzun: s.idle_long  ? parseInt(s.idle_long)  : t.idle_uzun,
        risk_kritik: s.risk_critical ? parseInt(s.risk_critical) : t.risk_kritik,
        risk_uyari:  s.risk_warn     ? parseInt(s.risk_warn)     : t.risk_uyari,
        if_kritik:   s.if_critical   ? parseFloat(s.if_critical) : t.if_kritik,
        if_uyari:    s.if_warn       ? parseFloat(s.if_warn)     : t.if_uyari,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsData.settings]);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const { data: usersData = {}, refetch: refetchUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch('/api/users',{credentials:'include'}).then(r=>r.json()),
  });

  const queryClient = useQueryClient();
  const users = usersData.users || [];
  const [newUsername, setNewUsername] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [newRole, setNewRole] = React.useState("viewer");
  const [newDept, setNewDept] = React.useState("");
  const [newFullName, setNewFullName] = React.useState("");

  const addUserMutation = useMutation({
    mutationFn: (d) => fetch('/api/users/add',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(r=>r.json()),
    onSuccess: () => { refetchUsers(); setNewUsername(""); setNewPassword(""); setNewDept(""); setNewFullName(""); },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (username) => fetch('/api/users/delete',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})}).then(r=>r.json()),
    onSuccess: () => refetchUsers(),
  });

  const handleRoleChange = (u, role) => fetch('/api/users/role',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.username,role})}).then(()=>refetchUsers());

  const updateUserMutation = useMutation({
    mutationFn: () => Promise.resolve(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const handleSaveThresholds = () => {
    // API'ye kaydet
    fetch('/api/settings', {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        idle_short: thresholds.idle_kisa,
        idle_long:  thresholds.idle_uzun,
        risk_critical: thresholds.risk_kritik,
        risk_warn:     thresholds.risk_uyari,
        if_critical:   thresholds.if_kritik,
        if_warn:       thresholds.if_uyari,
      })
    }).then(() => {
      setSaved(true);
      toast({ title: "Kaydedildi", description: "Ayarlar güncellendi." });
      setTimeout(() => setSaved(false), 2000);
    }).catch(() => {
      toast({ title: "Hata", description: "Kayıt başarısız." });
    });
  };



  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Yönetici Paneli</h2>
        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Admin</Badge>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-lg p-1 w-fit">
        {SECTIONS.map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              section === s
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* --- Eşik Değerleri --- */}
      {section === "Eşik Değerleri" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ThresholdCard
            title="Risk Skoru Eşikleri"
            icon={<Sliders className="w-4 h-4 text-primary" />}
            fields={[
              { key: "risk_kritik", label: "Kritik Eşiği", min: 0, max: 100, step: 1, suffix: "" },
              { key: "risk_uyari",  label: "Uyarı Eşiği",  min: 0, max: 100, step: 1, suffix: "" },
            ]}
            values={thresholds}
            onChange={(k, v) => setThresholds(p => ({ ...p, [k]: v }))}
          />
          <ThresholdCard
            title="Isolation Forest Eşikleri"
            icon={<Shield className="w-4 h-4 text-yellow-400" />}
            fields={[
              { key: "if_kritik", label: "Kritik Eşiği", min: 0, max: 1, step: 0.01, suffix: "" },
              { key: "if_uyari",  label: "Uyarı Eşiği",  min: 0, max: 1, step: 0.01, suffix: "" },
            ]}
            values={thresholds}
            onChange={(k, v) => setThresholds(p => ({ ...p, [k]: v }))}
          />
          <ThresholdCard
            title="Mola / Boşta Kalma"
            icon={<RefreshCw className="w-4 h-4 text-slate-400" />}
            fields={[
              { key: "idle_uzun", label: "Uzun Boşta (dk)", min: 1, max: 120, step: 1, suffix: " dk" },
              { key: "idle_kisa", label: "Kısa Mola (dk)",  min: 1, max: 60,  step: 1, suffix: " dk" },
            ]}
            values={thresholds}
            onChange={(k, v) => setThresholds(p => ({ ...p, [k]: v }))}
          />
          <div className="flex items-end">
            <button
              onClick={handleSaveThresholds}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                saved
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
              }`}
            >
              <Save className="w-4 h-4" />
              {saved ? "Kaydedildi ✓" : "Kaydet"}
            </button>
          </div>
        </div>
      )}

      {/* --- Kullanıcılar --- */}
      {section === "Kullanıcılar" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Kayıtlı Kullanıcılar</span>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{users.length}</Badge>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kullanıcı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ad Soyad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Departman</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-xs">Kullanıcı bulunamadı</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary uppercase">{(u.full_name || u.email || "?").charAt(0)}</span>
                      </div>
                      <span className="text-foreground text-xs font-medium">{u.username || u.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.full_name || "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    <input
                      defaultValue={u.department || ""}
                      onBlur={e => {
                        const dept = e.target.value.trim();
                        if (dept !== (u.department || ""))
                          fetch('/api/users/role',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.username,role:u.role,department:dept})}).then(()=>refetchUsers());
                      }}
                      placeholder="Departman..."
                      className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-28"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role || "viewer"}
                      onChange={e => handleRoleChange(u, e.target.value)}
                      className="bg-secondary border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="admin">admin</option>
                      <option value="manager">manager</option>
                      <option value="viewer">viewer</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteUserMutation.mutate(u.username)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-400/30 hover:bg-red-400/10 transition-all">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t border-border flex gap-2 flex-wrap">
            <input value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="Kullanıcı adı" className="bg-secondary border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <input value={newFullName} onChange={e=>setNewFullName(e.target.value)} placeholder="Ad Soyad" className="bg-secondary border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <input value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Şifre" type="password" className="bg-secondary border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <input value={newDept} onChange={e=>setNewDept(e.target.value)} placeholder="Departman" className="bg-secondary border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-28" />
            <select value={newRole} onChange={e=>setNewRole(e.target.value)} className="bg-secondary border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
              <option value="admin">admin</option>
              <option value="manager">manager</option>
              <option value="viewer">viewer</option>
            </select>
            <button onClick={() => addUserMutation.mutate({username:newUsername,password:newPassword,role:newRole,department:newDept,full_name:newFullName})} className="px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs hover:bg-primary/20 transition-all">+ Kullanıcı Ekle</button>
          </div>
        </div>
      )}

      {/* --- Sistem Ayarları --- */}
      {section === "Sistem Ayarları" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard title="Sistem Bilgisi" icon={<Settings className="w-4 h-4 text-primary" />}>
            <InfoRow label="Platform" value="OMNISIGHT v1.0" />
            <InfoRow label="Ortam" value="Üretim" />
            <InfoRow label="Tarih" value={new Date().toLocaleDateString("tr-TR")} />
            <InfoRow label="Saat Dilimi" value={Intl.DateTimeFormat().resolvedOptions().timeZone} />
          </InfoCard>
          <InfoCard title="Güvenlik Ayarları" icon={<Shield className="w-4 h-4 text-yellow-400" />}>
            <ToggleRow label="Otomatik Alarm" defaultChecked={true} />
            <ToggleRow label="USB Uyarısı" defaultChecked={true} />
            <ToggleRow label="Mesai Dışı Uyarı" defaultChecked={false} />
            <ToggleRow label="Tarayıcı Bildirimi" defaultChecked={true} />
          </InfoCard>
        </div>
      )}

      {/* --- SOAR Kuralları --- */}
      {section === "SOAR Kuralları" && (
        <SoarPanel />
      )}

      {/* --- Blacklist --- */}
      {section === "Blacklist" && (
        <div className="space-y-4">
          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <span className="text-xs font-semibold text-foreground">Yeni Domain Ekle</span>
            <div className="flex gap-2 flex-wrap">
              <input value={newDomain} onChange={e=>setNewDomain(e.target.value)}
                placeholder="örn: youtube.com"
                className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-xs text-foreground" />
              <select value={newCategory} onChange={e=>setNewCategory(e.target.value)}
                className="bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground">
                <option value="mesajlasma">Mesajlaşma</option>
                <option value="video">Video</option>
                <option value="sosyal">Sosyal Medya</option>
                <option value="cloud_upload">Cloud Upload</option>
                <option value="oyun">Oyun</option>
                <option value="diger">Diğer</option>
              </select>
              <select value={newSeverity} onChange={e=>setNewSeverity(e.target.value)}
                className="bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground">
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
              </select>
              <button onClick={() => newDomain && addDomainMutation.mutate({domain:newDomain, category:newCategory, severity:newSeverity})}
                className="px-3 py-1.5 rounded text-xs bg-primary text-white hover:bg-primary/80">
                Ekle
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {(blacklistData.blacklist || []).map((b, i) => (
              <div key={i} className="flex items-center justify-between bg-secondary/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-foreground">{b.domain}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">{b.category}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${b.severity==='critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{b.severity}</span>
                </div>
                <button onClick={() => removeDomainMutation.mutate(b.domain)}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10">
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Puan Tablosu --- */}
      {section === "Puan Tablosu" && (
        <PuanTablosu />
      )}
    </div>
  );
}

function ThresholdCard({ title, icon, fields, values, onChange }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      {fields.map(f => (
        <div key={f.key}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground">{f.label}</label>
            <span className="text-xs font-bold text-foreground font-mono">
              {Number(values[f.key]).toFixed(f.step < 1 ? 2 : 0)}{f.suffix}
            </span>
          </div>
          <input
            type="range"
            min={f.min}
            max={f.max}
            step={f.step}
            value={values[f.key]}
            onChange={e => onChange(f.key, parseFloat(e.target.value))}
            className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>{f.min}{f.suffix}</span>
            <span>{f.max}{f.suffix}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoCard({ title, icon, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}

function ToggleRow({ label, defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <button
        onClick={() => setChecked(p => !p)}
        className={`w-9 h-5 rounded-full transition-all relative ${checked ? "bg-primary" : "bg-secondary border border-border"}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? "left-4" : "left-0.5"}`} />
      </button>
    </div>
  );
}
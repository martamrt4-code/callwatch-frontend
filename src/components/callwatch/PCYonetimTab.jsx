import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pcNames } from "@/api/callwatchClient";
import { Monitor, Pencil, Check, X, Users, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

const SHIFTS = [
  { key: 'sabah', label: 'Sabah', time: '06:00–14:00', color: 'text-yellow-400' },
  { key: 'oglen', label: 'Öğle', time: '14:00–22:00', color: 'text-blue-400' },
  { key: 'gece', label: 'Gece', time: '22:00–06:00', color: 'text-purple-400' },
];

function ShiftProfileEditor({ pcName, onClose }) {
  const qc = useQueryClient();
  const { data = {}, isLoading } = useQuery({
    queryKey: ["shift-profiles", pcName],
    queryFn: () => fetch(`/api/shift-profiles?pc=${pcName}`, {credentials:'include'}).then(r=>r.json()),
  });

  const profiles = data.profiles || [];
  const [editShift, setEditShift] = useState(null);
  const [form, setForm] = useState({});

  const saveMutation = useMutation({
    mutationFn: (data) => fetch('/api/shift-profiles/update', {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }).then(r=>r.json()),
    onSuccess: () => {
      qc.invalidateQueries(["shift-profiles", pcName]);
      setEditShift(null);
    }
  });

  const getProfile = (shift) => profiles.find(p => p.shift === shift) || {};

  const startEdit = (shift) => {
    const p = getProfile(shift);
    setForm({
      pc_name: pcName,
      shift,
      employee_name: p.employee_name || '',
      allowed_sites: (typeof p.allowed_sites === 'string' ? JSON.parse(p.allowed_sites || '[]') : p.allowed_sites || []).join(', '),
      allowed_apps: (typeof p.allowed_apps === 'string' ? JSON.parse(p.allowed_apps || '[]') : p.allowed_apps || []).join(', '),
      max_mola_dakika: p.max_mola_dakika || 60,
      normal_alarm_esigi: p.normal_alarm_esigi || 3,
      notes: p.notes || '',
    });
    setEditShift(shift);
  };

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      allowed_sites: form.allowed_sites.split(',').map(s=>s.trim()).filter(Boolean),
      allowed_apps: form.allowed_apps.split(',').map(s=>s.trim()).filter(Boolean),
      max_mola_dakika: parseInt(form.max_mola_dakika) || 60,
      normal_alarm_esigi: parseInt(form.normal_alarm_esigi) || 3,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white text-sm">{pcName} — Vardiya Profilleri</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          {SHIFTS.map(shift => {
            const p = getProfile(shift.key);
            const sites = typeof p.allowed_sites === 'string' ? JSON.parse(p.allowed_sites || '[]') : (p.allowed_sites || []);
            const apps = typeof p.allowed_apps === 'string' ? JSON.parse(p.allowed_apps || '[]') : (p.allowed_apps || []);
            const isEditing = editShift === shift.key;

            return (
              <div key={shift.key} className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${shift.color}`}>{shift.label} Vardiyası</span>
                    <span className="text-xs text-slate-500">{shift.time}</span>
                  </div>
                  {!isEditing && (
                    <button onClick={() => startEdit(shift.key)}
                      className="px-2 py-1 rounded text-xs border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400">
                      <Pencil className="w-3 h-3 inline mr-1" />Düzenle
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Çalışan Adı</label>
                      <input value={form.employee_name} onChange={e=>setForm({...form,employee_name:e.target.value})}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-xs"
                        placeholder="Ad Soyad" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">İzin Verilen Siteler (virgülle ayırın)</label>
                      <input value={form.allowed_sites} onChange={e=>setForm({...form,allowed_sites:e.target.value})}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-xs"
                        placeholder="google.com, outlook.com, microsoft.com" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">İzin Verilen Uygulamalar (virgülle ayırın)</label>
                      <input value={form.allowed_apps} onChange={e=>setForm({...form,allowed_apps:e.target.value})}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-xs"
                        placeholder="chrome.exe, outlook.exe, excel.exe" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Max Mola (dakika)</label>
                        <input type="number" value={form.max_mola_dakika} onChange={e=>setForm({...form,max_mola_dakika:e.target.value})}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-xs" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Normal Alarm Eşiği</label>
                        <input type="number" value={form.normal_alarm_esigi} onChange={e=>setForm({...form,normal_alarm_esigi:e.target.value})}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Notlar</label>
                      <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-white text-xs"
                        rows={2} placeholder="Bu vardiya hakkında notlar..." />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSave} disabled={saveMutation.isPending}
                        className="px-3 py-1.5 rounded text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">
                        {saveMutation.isPending ? 'Kaydediliyor...' : '✓ Kaydet'}
                      </button>
                      <button onClick={() => setEditShift(null)}
                        className="px-3 py-1.5 rounded text-xs border border-slate-600 text-slate-400 hover:text-white">
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs space-y-1">
                    <div><span className="text-slate-500">Çalışan:</span> <span className="text-white">{p.employee_name || <span className="italic text-slate-600">Tanımlanmadı</span>}</span></div>
                    <div><span className="text-slate-500">İzinli siteler:</span> <span className="text-slate-300">{sites.length ? sites.join(', ') : <span className="italic text-slate-600">Tanımlanmadı</span>}</span></div>
                    <div><span className="text-slate-500">İzinli uygulamalar:</span> <span className="text-slate-300">{apps.length ? apps.join(', ') : <span className="italic text-slate-600">Tanımlanmadı</span>}</span></div>
                    <div><span className="text-slate-500">Max mola:</span> <span className="text-slate-300">{p.max_mola_dakika || 60} dk</span> · <span className="text-slate-500">Alarm eşiği:</span> <span className="text-slate-300">{p.normal_alarm_esigi || 3}</span></div>
                    {p.notes && <div><span className="text-slate-500">Not:</span> <span className="text-slate-300">{p.notes}</span></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PCYonetimTab() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [profilePC, setProfilePC] = useState(null);
  const [warningPC, setWarningPC] = useState(null);


  const warnMutation = useMutation({
    mutationFn: (pc_name) => fetch('/api/warn-pc', {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({pc_name})
    }).then(r=>r.json()),
    onSuccess: (data, pc_name) => {
      alert(`✓ ${pc_name} için uyarı gönderildi!`);
      setWarningPC(null);
    },
    onError: () => setWarningPC(null),
  });

  const { data = {}, isLoading } = useQuery({
    queryKey: ["pc-names"],
    queryFn: () => pcNames.list(),
  });

  const pcs = data.pc_names || [];

  const updateMutation = useMutation({
    mutationFn: ({ pc_name, display_name, owner_name, department }) =>
      pcNames.update(pc_name, display_name, owner_name, department),
    onSuccess: () => {
      qc.invalidateQueries(["pc-names"]);
      setEditingId(null);
    },
  });

  return (
    <div className="p-4">
      {profilePC && <ShiftProfileEditor pcName={profilePC} onClose={() => setProfilePC(null)} />}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">PC Yönetimi</h3>
          <span className="text-xs text-muted-foreground ml-2">{pcs.length} PC</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">PC ADI</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">GÖRÜNEN AD</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">SAHİP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">DEPARTMAN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Yükleniyor...</td></tr>
              ) : pcs.map((pc) => (
                <tr key={pc.pc_name} className="border-b border-border/50 hover:bg-secondary/30">
                  {editingId === pc.pc_name ? (
                    <>
                      <td className="px-4 py-2 font-mono text-xs">{pc.pc_name}</td>
                      <td className="px-4 py-2"><input value={editForm.display_name} onChange={e=>setEditForm({...editForm,display_name:e.target.value})} className="bg-input border border-border rounded px-2 py-1 text-xs w-full" /></td>
                      <td className="px-4 py-2"><input value={editForm.owner_name} onChange={e=>setEditForm({...editForm,owner_name:e.target.value})} className="bg-input border border-border rounded px-2 py-1 text-xs w-full" /></td>
                      <td className="px-4 py-2"><input value={editForm.department} onChange={e=>setEditForm({...editForm,department:e.target.value})} className="bg-input border border-border rounded px-2 py-1 text-xs w-full" /></td>
                      <td className="px-4 py-2 flex gap-1">
                        <button onClick={() => updateMutation.mutate({pc_name: pc.pc_name, ...editForm})} className="px-2 py-1 rounded text-xs bg-emerald-600 text-white"><Check className="w-3 h-3" /></button>
                        <button onClick={() => setEditingId(null)} className="px-2 py-1 rounded text-xs border border-border"><X className="w-3 h-3" /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-mono text-xs">{pc.pc_name}</td>
                      <td className="px-4 py-3 text-xs">{pc.display_name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{pc.owner_name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{pc.department || '—'}</td>
                      <td className="px-4 py-3 flex gap-1">
                        <button onClick={() => { setEditingId(pc.pc_name); setEditForm({display_name: pc.display_name||'', owner_name: pc.owner_name||'', department: pc.department||''}); }}
                          className="px-2 py-1 rounded text-xs border border-border hover:bg-secondary"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => setProfilePC(pc.pc_name)}
                          className="px-2 py-1 rounded text-xs border border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                          <Users className="w-3 h-3 inline" /> Vardiya
                        </button>


                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

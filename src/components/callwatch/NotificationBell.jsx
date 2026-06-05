import React, { useEffect, useRef, useState } from "react";
import PCDetailModal from "./PCDetailModal";
import { Bell, BellRing, X, Volume2, VolumeX } from "lucide-react";

export default function NotificationBell({ alarms, prevAlarmCount }) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [detailPC, setDetailPC] = useState(null);
  const [lastCount, setLastCount] = useState(0);
  
  // Yeni alarm gelince ses çal
  const playAlert = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch(e) {}
  };
  const audioCtxRef = useRef(null);
  const prevCount = useRef(prevAlarmCount ?? alarms.length);

  const playBeep = () => {
    if (muted) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  useEffect(() => {
    if (alarms.length > prevCount.current) {
      const newAlarms = alarms.slice(0, alarms.length - prevCount.current);
      const notifs = newAlarms.map(a => ({
        id: a.id || Date.now() + Math.random(),
        pc: a.pc_name,
        type: a.alarm_type,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        department: a.department,
        shift: a.shift,
        severity: a.severity,
        description: a.description,
      }));
      setNotifications(prev => [...notifs, ...prev].slice(0, 20));
      playBeep();
      if ("Notification" in window && Notification.permission === "granted") {
        newAlarms.forEach(a => {
          new Notification("⚠️ OMNISIGHT Alarm", {
            body: `${a.pc_name}: ${a.alarm_type}`,
            icon: "/favicon.ico",
          });
        });
      } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
    prevCount.current = alarms.length;
  }, [alarms.length]);

  // Yeni alarm gelince ses çal
  useEffect(() => {
    if (alarms.length > lastCount && lastCount > 0) {
      playAlert();
    }
    setLastCount(alarms.length);
  }, [alarms.length]);
  
  const hasNew = notifications.length > 0;

  return (
    <>
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-8 h-8 rounded-lg bg-secondary/50 border border-border hover:bg-secondary transition-colors flex items-center justify-center"
      >
        {hasNew ? (
          <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
        ) : (
          <Bell className="w-4 h-4 text-muted-foreground" />
        )}
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
            {Math.min(notifications.length, 9)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-72 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-semibold text-foreground">Bildirimler</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setMuted(m => !m)} className="text-muted-foreground hover:text-foreground transition-colors">
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setNotifications([])} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                Temizle
              </button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Bildirim yok</p>
            ) : (
              notifications.map((n, i) => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-border/40 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setDetailPC({pc_name: n.pc, status: n.severity === "critical" ? "anomali" : "uyari", department: n.department, shift: n.shift, description: n.description})}>
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{n.pc}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{n.type}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0">{n.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
    {detailPC && <PCDetailModal device={detailPC} onClose={() => setDetailPC(null)} />}
  </>
  );
}
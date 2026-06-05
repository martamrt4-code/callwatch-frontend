const BASE = "";;

async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const callwatch = {
  alarms: {
    list:   () => api('/api/alarms'),
    close:  (id, status, note) => api(`/api/alarms/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, note, reviewed_by: 'Admin' }),
    }),
    closed: () => api('/api/alarms?status=closed'),
  },
  events: {
    list: () => api('/api/events?limit=200'),
  },
  webActivity: () => api('/api/web-activity'),
  ifHistory: {
    list: () => api('/api/if-score-history'),
  },
  ifResults: {
    list: () => api('/api/if-results'),
  },
  risk: {
    scores:       () => api('/api/risk-scores'),
    correlations: () => api('/api/correlations'),
    weekly:       () => api('/api/weekly-summary'),
    monthly:      () => api('/api/monthly-top'),
    bestWorst:    () => api('/api/risk-scores').then(d => {
      const scores = d.scores || [];
      const sorted = [...scores].sort((a,b) => b.score - a.score);
      return {
        best:  sorted.length ? { pc_name: sorted[sorted.length-1].pc_name, score: sorted[sorted.length-1].score } : null,
        worst: sorted.length ? { pc_name: sorted[0].pc_name, score: sorted[0].score } : null,
      };
    }),
  },
  audit: {
    list: () => api('/api/audit-log'),
  },
  heatmap: () => api('/api/heatmap'),
  idleStatus: () => api('/api/idle-status'),
  blacklist: {
    list:   () => api('/api/blacklist'),
    add:    (domain, category, severity, description) => api('/api/blacklist/add', {
      method: 'POST',
      body: JSON.stringify({ domain, category, severity, description }),
    }),
    delete: (domain) => api('/api/blacklist/delete', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    }),
  },
  me: () => api('/api/me'),
};


// PC isimleri
// PC isim cache
let _pcNamesCache = {};
export async function loadPcNames() {
  try {
    const d = await api('/api/pc-names');
    _pcNamesCache = {};
    (d.pc_names || []).forEach(p => {
      _pcNamesCache[p.pc_name] = p.display_name || p.pc_name;
    });
  } catch(e) {}
}
export function getDisplayName(pc_name) {
  return _pcNamesCache[pc_name] || _pcNamesCache[pc_name?.toUpperCase()] || pc_name;
}
loadPcNames();

export const pcNames = {
  list: () => api('/api/pc-names'),
  update: (pc_name, display_name, owner_name, department) => api('/api/pc-names/update', {
    method: 'POST',
    body: JSON.stringify({ pc_name, display_name, owner_name, department }),
  }),
};

async function tmFetch(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const teramind = {
  computers: () => tmFetch('/tm-api/computer'),
  agents: () => tmFetch('/tm-api/agent'),
  departments: () => tmFetch('/tm-api/department'),
};

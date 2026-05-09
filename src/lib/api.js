const rawBase = import.meta.env.VITE_API_BASE_URL?.trim() || ''

function normalizeBase(base) {
  if (!base) return ''
  return base.endsWith('/') ? base.slice(0, -1) : base
}

const API_BASE = normalizeBase(rawBase)

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE) return `/api${normalizedPath}`
  return `${API_BASE}/api${normalizedPath}`
}


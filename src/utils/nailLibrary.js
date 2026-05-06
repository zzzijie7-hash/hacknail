const STORAGE_KEY = 'cyber_nails_library'

export function loadLibrary() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveLibrary(nails) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nails))
}

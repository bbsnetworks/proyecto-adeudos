// src/services/deudores.js

const TUNNEL_BASE =
  "http://b88e0bd2df17.sn.mynetname.net:80/adeudos-api";

// LAN (en tu red local)
const LAN_BASE =
  import.meta.env.VITE_API_LAN || "http://192.168.99.253:80/adeudos-api";

// Si quieres forzar una base por env (opcional)
const ENV_BASE = import.meta.env.VITE_API_BASE || "";

const STORAGE_KEY = "ADEUDOS_API_BASE_SELECTED";
const PROBE_TIMEOUT_MS = 1200; // tiempo para decidir fallback
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

function now() {
  return Date.now();
}

function getCachedBase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.base || !parsed?.ts) return null;
    if (now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.base;
  } catch {
    return null;
  }
}

function setCachedBase(base) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ base, ts: now() }));
  } catch {}
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function probeBase(base) {
  // Endpoint ligero que ya tienes:
  const baseClean = base.replace(/\/$/, "");
  const url = `${baseClean}/get_localidades.php`;

  const res = await fetchWithTimeout(url, PROBE_TIMEOUT_MS);
  if (!res.ok) throw new Error("probe not ok");
  const json = await res.json();
  if (!json?.success) throw new Error("probe json not ok");
  return true;
}

async function resolveApiBase() {
  // 0) Si el usuario define VITE_API_BASE, úsalo sin fallback
  if (ENV_BASE) return ENV_BASE;

  // 1) Cache
  const cached = getCachedBase();
  if (cached) return cached;

  // 2) Preferimos LAN primero (porque el problema es que el túnel a veces no entra desde LAN)
  try {
    await probeBase(LAN_BASE);
    setCachedBase(LAN_BASE);
    return LAN_BASE;
  } catch {}

  // 3) Fallback a túnel
  try {
    await probeBase(TUNNEL_BASE);
    setCachedBase(TUNNEL_BASE);
    return TUNNEL_BASE;
  } catch {}

  // 4) Último recurso
  return TUNNEL_BASE;
}

function buildUrl(base, path, params) {
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${b}${p}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v) !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }
  return url.toString();
}

export async function fetchDeudores({
  q = "",
  plan = "",
  localidad = "",
  minMonths = 2,
  page = 1,
  limit = 10,
} = {}) {
  const base = await resolveApiBase();

  const url = buildUrl(base, "/deudores.php", {
    minMonths,
    page,
    limit,
    ...(q ? { q } : {}),
    ...(plan ? { plan } : {}),
    ...(localidad ? { localidad } : {}),
  });

  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al cargar deudores");

  const json = await res.json();
  if (!json.success) throw new Error(json.message || "La API devolvió un error");
  return json;
}

export async function fetchLocalidades() {
  const base = await resolveApiBase();
  const url = buildUrl(base, "/get_localidades.php");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al cargar localidades");

  const json = await res.json();
  if (!json.success) throw new Error(json.message || "La API devolvió un error");
  return json.data || [];
}

// Opcional: botón "Re-detectar" o al cambiar red
export function resetApiBaseCache() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

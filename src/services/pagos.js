// src/services/pagos.js

// ===== BASES =====
const TUNNEL_BASE =
  "http://b88e0bd2df17.sn.mynetname.net:80/adeudos-api";

const LAN_BASE =
  import.meta.env.VITE_API_LAN || "http://192.168.99.253:80/adeudos-api";

// Si se define explícitamente, se usa sin fallback
const ENV_BASE = import.meta.env.VITE_API_BASE || "";

// ===== CACHE =====
const STORAGE_KEY = "ADEUDOS_API_BASE_SELECTED";
const PROBE_TIMEOUT_MS = 1200;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

function now() {
  return Date.now();
}

function getCachedBase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { base, ts } = JSON.parse(raw);
    if (!base || !ts) return null;
    if (now() - ts > CACHE_TTL_MS) return null;
    return base;
  } catch {
    return null;
  }
}

function setCachedBase(base) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ base, ts: now() })
    );
  } catch {}
}

// ===== PROBE =====
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
  const clean = base.replace(/\/$/, "");
  const url = `${clean}/get_localidades.php`; // endpoint ligero

  const res = await fetchWithTimeout(url, PROBE_TIMEOUT_MS);
  if (!res.ok) throw new Error("probe failed");

  const json = await res.json();
  if (!json?.success) throw new Error("probe invalid");
  return true;
}

// ===== RESOLVER =====
async function resolveApiBase() {
  // 1) Forzado por env
  if (ENV_BASE) return ENV_BASE;

  // 2) Cache
  const cached = getCachedBase();
  if (cached) return cached;

  // 3) Preferir LAN
  try {
    await probeBase(LAN_BASE);
    setCachedBase(LAN_BASE);
    return LAN_BASE;
  } catch {}

  // 4) Fallback túnel
  try {
    await probeBase(TUNNEL_BASE);
    setCachedBase(TUNNEL_BASE);
    return TUNNEL_BASE;
  } catch {}

  // 5) Último recurso
  return TUNNEL_BASE;
}

// ===== URL BUILDER =====
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

// ===== API =====
export async function fetchPagosCliente({ idcliente, year }) {
  const base = await resolveApiBase();

  const url = buildUrl(base, "/pagos_cliente.php", {
    idcliente,
    year,
  });

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Error al cargar pagos del cliente");
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "La API devolvió un error");
  }

  return json;
}

// Opcional: para forzar redetección manual
export function resetApiBaseCache() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

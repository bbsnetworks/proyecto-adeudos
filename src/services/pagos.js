// src/services/pagos.js

// Ej: http://192.168.99.253:8080/adeudos-api
const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8080/adeudos-api";

function buildUrl(path, params) {
  const base = API_BASE.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${p}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v) !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }

  return url.toString();
}

export async function fetchPagosCliente({ idcliente, year }) {
  const url = buildUrl("/pagos_cliente.php", {
    idcliente,
    year,
  });

  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al cargar pagos del cliente");

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "La API devolvió un error");
  }

  return json;
}

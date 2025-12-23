// src/services/deudores.js
const API_URL = "http://localhost:8080/adeudos-api/deudores.php";
const LOC_URL = "http://localhost:8080/adeudos-api/get_localidades.php"; // crea este endpoint

export async function fetchDeudores({
  q = "",
  plan = "",
  localidad = "",
  minMonths = 2,
  page = 1,
  limit = 10,
} = {}) {
  const params = new URLSearchParams({
    minMonths: String(minMonths),
    page: String(page),
    limit: String(limit),
  });

  if (q) params.append("q", q);
  if (plan) params.append("plan", plan);
  if (localidad) params.append("localidad", localidad);

  const res = await fetch(`${API_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Error al cargar deudores");
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "La API devolvió un error");
  return json;
}

export async function fetchLocalidades() {
  const res = await fetch(LOC_URL);
  if (!res.ok) throw new Error("Error al cargar localidades");
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "La API devolvió un error");
  return json.data || []; // ["Uriangato", "Moroleon", ...]
}

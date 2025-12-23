// src/services/pagos.js
const API_PAGOS = "http://localhost:8080/adeudos-api/pagos_cliente.php"; // crea este endpoint

export async function fetchPagosCliente({ idcliente, year }) {
  const params = new URLSearchParams({ idcliente: String(idcliente), year: String(year) });
  const res = await fetch(`${API_PAGOS}?${params.toString()}`);
  if (!res.ok) throw new Error("Error al cargar pagos del cliente");
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "La API devolvió un error");
  return json;
}

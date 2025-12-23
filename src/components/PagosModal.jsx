import { useEffect, useMemo, useState } from "react";
import { fetchPagosCliente } from "../services/pagos";

const MESES = [
  "ENERO","FEBRERO","MARZO","ABRIL",
  "MAYO","JUNIO","JULIO","AGOSTO",
  "SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"
];

function ymdToPretty(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return "—";
  return d.toISOString().slice(0, 10);
}

export default function PagosModal({ open, onClose, cliente }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState([]); // [1..12]
  const [ultimoCorte, setUltimoCorte] = useState("");
  const [error, setError] = useState("");

  const paidSet = useMemo(() => new Set(paid), [paid]);

  useEffect(() => {
    if (!open || !cliente?.idcliente) return;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const r = await fetchPagosCliente({ idcliente: cliente.idcliente, year });
        setPaid(r.paidMonths || []);
        setUltimoCorte(r.ultimo_corte || "");
      } catch (e) {
        setError(e.message || "Error");
        setPaid([]);
        setUltimoCorte("");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, cliente?.idcliente, year]);

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 ring-1 ring-blue-400/40 grid place-items-center text-blue-300 font-bold">
                B
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">PAGOS</div>
                <div className="text-xs text-neutral-400">
                  ID Cliente: <span className="text-neutral-200 font-medium">{cliente?.idcliente ?? "—"}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl grid place-items-center hover:bg-neutral-900 border border-neutral-800 text-neutral-300 !p-0"
              title="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-5">
            {/* Header controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-lg font-semibold tracking-tight">{cliente?.nombre || "—"}</div>
                <div className="text-xs text-neutral-400">{cliente?.telefono || "—"}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs text-neutral-400">Año</div>
                <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
                  <button
                    className="px-3 py-2 text-neutral-300 hover:bg-neutral-800"
                    onClick={() => setYear((y) => y - 1)}
                    title="Año anterior"
                  >
                    −
                  </button>
                  <input
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value || "0", 10) || new Date().getFullYear())}
                    className="w-20 text-center bg-transparent outline-none text-neutral-100 py-2"
                    inputMode="numeric"
                  />
                  <button
                    className="px-3 py-2 text-neutral-300 hover:bg-neutral-800"
                    onClick={() => setYear((y) => y + 1)}
                    title="Año siguiente"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4">
              {error && (
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-600/10 text-red-200 text-sm">
                  {error}
                </div>
              )}
              {loading && (
                <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 text-neutral-300 text-sm">
                  Cargando pagos…
                </div>
              )}
            </div>

            {/* Months grid */}
            <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-3 md:p-4">
              <div className="text-xs text-neutral-400 mb-3">Pagos</div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {MESES.map((m, idx) => {
                  const monthNumber = idx + 1;
                  const isPaid = paidSet.has(monthNumber);

                  return (
                    <div
                      key={m}
                      className={[
                        "rounded-xl border px-3 py-3 flex items-center justify-center gap-2 select-none",
                        isPaid
                          ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-200"
                          : "bg-neutral-950/30 border-neutral-800 text-neutral-300"
                      ].join(" ")}
                      title={isPaid ? "Pagado" : "No pagado"}
                    >
                      <span
                        className={[
                          "w-8 h-8 rounded-lg grid place-items-center text-sm border",
                          isPaid
                            ? "bg-emerald-500/20 border-emerald-500/40"
                            : "bg-neutral-900 border-neutral-800"
                        ].join(" ")}
                      >
                        $
                      </span>
                      <span className="font-semibold tracking-wide text-sm">{m}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-neutral-300">
                  <span className="text-neutral-400">Último corte:</span>{" "}
                  <span className="font-semibold text-red-300">{ymdToPretty(ultimoCorte)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 text-xs text-neutral-400">
                    <span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500/40" />
                    Pagado
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs text-neutral-400">
                    <span className="w-3 h-3 rounded bg-neutral-900 border border-neutral-800" />
                    No pagado
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:bg-neutral-800"
              >
                ← Salir
              </button>

              <div className="text-xs text-neutral-500">
                Vista de pagos por año
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

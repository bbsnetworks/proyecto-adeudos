import { useEffect, useMemo, useState } from "react";
import { fetchDeudores, fetchLocalidades } from "../services/deudores";
import PagosModal from "../components/PagosModal";

const currency = (n) =>
  (n ?? 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });

function formatMesAnioES(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate + "T00:00:00");
  if (isNaN(d)) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(d);
}

const atrasoChip = (m) => {
  if (m >= 6) return "bg-red-600/20 text-red-300 ring-1 ring-red-600/40";
  if (m >= 3)
    return "bg-orange-600/20 text-orange-300 ring-1 ring-orange-600/40";
  return "bg-amber-600/20 text-amber-200 ring-1 ring-amber-600/30";
};

export default function ListaDeudores() {
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [localidades, setLocalidades] = useState([]);
  const [openPagos, setOpenPagos] = useState(false);
  const [clienteSel, setClienteSel] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const r = await fetchDeudores({
        q,
        plan,
        localidad,
        page,
        limit,
        minMonths: 2,
      });
      setRows(r.data || []);
      setTotal(r.total || 0);
    } catch (e) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [page, limit]);
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q, plan, localidad]);
  useEffect(() => {
    (async () => {
      try {
        const locs = await fetchLocalidades();
        setLocalidades(locs);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const totalAdeudo = useMemo(
    () => rows.reduce((a, x) => a + (x.adeudo_estimado || 0), 0),
    [rows]
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/70 bg-neutral-950/80 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 ring-1 ring-blue-400/40 grid place-items-center text-blue-300 font-bold">
              B
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Adeudos — Internet ISP
              </h1>
              <p className="text-xs text-neutral-400">
                Clientes con ≥ 2 meses de atraso
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPI
            title="Resultados (página)"
            value={rows.length.toString()}
            hint={`de ${total} totales`}
          />
          <KPI
            title="Adeudo visible"
            value={currency(totalAdeudo)}
            hint="suma de esta página"
          />
          <KPI
            title="Promedio visible"
            value={currency(
              rows.length ? Math.round(totalAdeudo / rows.length) : 0
            )}
            hint="por cliente (página)"
          />
        </section>

        {/* Controles */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nombre o teléfono..."
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 px-4 py-2.5 outline-none placeholder:text-neutral-500"
                />
              </div>

              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 outline-none focus:border-blue-500"
                title="Plan"
              >
                <option value="">Todos los planes</option>
                <option value="7 Mbps">7 Mbps</option>
                <option value="10 Mbps">10 Mbps</option>
                <option value="15 Mbps">15 Mbps</option>
                <option value="20 Mbps">20 Mbps</option>
                <option value="30 Mbps">30 Mbps</option>
                <option value="50 Mbps">50 Mbps</option>
              </select>
              <select
                value={localidad}
                onChange={(e) => {
                  setLocalidad(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 outline-none focus:border-blue-500"
                title="Localidad"
              >
                <option value="">Todas las localidades</option>
                {localidades.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
                className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 outline-none focus:border-blue-500"
                title="Por página"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>

            <div className="text-sm text-neutral-400">
              Página {page} / {totalPages} · {total} resultados
            </div>
          </div>
        </section>

        {/* Cards */}
        <section>
          {error && (
            <div className="p-4 text-red-300 bg-red-600/10 border border-red-500/30 rounded-xl mb-4">
              {error}
            </div>
          )}
          {loading && <div className="p-4 text-neutral-400">Cargando…</div>}
          {!loading && rows.length === 0 && (
            <div className="p-4 text-neutral-400">Sin resultados.</div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((x) => (
              <article
                key={x.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 hover:bg-neutral-900/70 transition"
              >
                <header className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold leading-tight">{x.nombre}</h3>
                    <p className="text-xs text-neutral-400">
                      {x.telefono || "—"}
                    </p>
                  </div>
                  <span
                    className={`text-xs rounded-lg px-2 py-1 font-medium ${atrasoChip(
                      x.meses_atraso
                    )}`}
                  >
                    {x.meses_atraso} meses
                  </span>
                </header>

                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Último mes pagado</span>
                    <span className="font-medium">
                      {formatMesAnioES(x.ultima_pago)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Plan</span>
                    <span className="text-blue-300">{x.plan || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Localidad · Nodo</span>
                    <span className="font-medium">
                      {(x.localidad || "—") + " · " + (x.nodo || "—")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Mensualidad</span>
                    <span className="font-medium">
                      {currency(x.mensualidad)}
                    </span>
                  </div>
                </div>

                <footer className="mt-3 flex items-center justify-between">
                  <div className="text-sm font-semibold rounded-lg px-2.5 py-1.5 ring-1 ring-amber-600/30 bg-amber-600/20 text-amber-200">
                    {currency(x.adeudo_estimado)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700"
                      onClick={() => {
                        setClienteSel(x);
                        setOpenPagos(true);
                      }}
                    >
                      Ver
                    </button>

                    <a
                      className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-500"
                      href={`https://wa.me/52${(x.telefono || "").replace(
                        /\\D/g,
                        ""
                      )}?text=${encodeURIComponent(
                        `Hola ${x.nombre}, notamos ${
                          x.meses_atraso
                        } mes(es) vencidos. Adeudo estimado: ${currency(
                          x.adeudo_estimado
                        )}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </section>

        {/* Paginación */}
        <Pagination
          page={page}
          total={total}
          limit={limit}
          onChange={setPage}
        />
        <PagosModal
          open={openPagos}
          onClose={() => setOpenPagos(false)}
          cliente={clienteSel}
        />
      </main>
    </div>
  );
}

function KPI({ title, value, hint }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900/60 to-neutral-900/30 p-4 shadow-inner shadow-neutral-950/20">
      <div className="text-xs text-neutral-400">{title}</div>
      <div className="mt-1.5 text-2xl font-semibold">{value}</div>
      <div className="text-[11px] text-neutral-500">{hint}</div>
    </div>
  );
}

function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;
  const go = (p) => onChange(Math.min(Math.max(1, p), totalPages));
  const items = [];
  for (let i = 1; i <= totalPages; i++) {
    items.push(
      <button
        key={i}
        onClick={() => onChange(i)}
        className={`px-3 py-1.5 text-sm rounded-xl border ${
          i === page
            ? "bg-neutral-200 text-neutral-900 border-neutral-200"
            : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
        }`}
      >
        {i}
      </button>
    );
  }
  return (
    <div className="flex items-center justify-center gap-2 mt-2">
      <button
        onClick={() => go(page - 1)}
        className="px-3 py-1.5 text-sm rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
      >
        Anterior
      </button>
      {items}
      <button
        onClick={() => go(page + 1)}
        className="px-3 py-1.5 text-sm rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
      >
        Siguiente
      </button>
    </div>
  );
}

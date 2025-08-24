// @ts-nocheck
// Services Status Dashboard — Single-File React App
// -------------------------------------------------
// How to use:
// 1) Place a file named `services.json` in your app's public root (served at `/services.json`).
//    Example Vite/CRA: put it in the `public/` folder.
// 2) The JSON should be an array of objects like:
//    [
//      { "location": "us-east-1", "priority": 1, "servicename": "Auth", "status": "up" },
//      { "location": "us-west-2", "priority": 2, "servicename": "Payments", "status": "intermittent" },
//      { "location": "eu-central-1", "priority": 1, "servicename": "Search", "status": "down" }
//    ]
// 3) This component will fetch `/services.json` on load and render collapsible sections grouped by `priority`.
// 4) Optional: Click the "Reload" button to re-fetch the JSON without a full page refresh.

import React, { useEffect, useMemo, useState } from "react";

/** @typedef {"down"|"intermittent"|"up"} Status */
/**
 * @typedef Service
 * @property {string} location
 * @property {number} priority
 * @property {string} servicename
 * @property {Status} status
 */

const STATUS_META = {
  down: {
    label: "Down",
    dot: "bg-red-500",
    text: "text-red-600",
    bg: "bg-red-50",
  },
  intermittent: {
    label: "Intermittent",
    dot: "bg-yellow-400",
    text: "text-yellow-700",
    bg: "bg-yellow-50",
  },
  up: {
    label: "Up",
    dot: "bg-green-500",
    text: "text-green-700",
    bg: "bg-green-50",
  },
  unknown: {
    label: "Unknown",
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-50",
  },
};

/** Small colored status pill */
function StatusPill({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.unknown;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${meta.bg} ${meta.text}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} aria-hidden />
      <span className="font-medium capitalize">{meta.label}</span>
    </span>
  );
}

/** Row for a single service */
function ServiceRow({ svc }) {
  const meta = STATUS_META[svc.status] ?? STATUS_META.unknown;
  return (
    <>
      <div
        className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow transition-shadow"
        role="row"
        aria-label={`${svc.servicename} in ${svc.location} is ${meta.label}`}
      >
        <div className="min-w-0 flex items-center gap-2">
          <span
            className="truncate font-medium text-gray-900"
            title={svc.servicename}
          >
            {svc.servicename}
          </span>
          <span className="text-sm text-gray-500 shrink-0" title={svc.location}>
            — {svc.location}
          </span>
        </div>
        <div className="justify-self-end">
          <StatusPill status={svc.status} />
        </div>
        <div className="text-xs text-gray-400 font-mono">P{svc.priority}</div>
      </div>
    </>
  );
}

/** Collapsible group by priority */
function PriorityGroup({ priority, services }) {
  const [open, setOpen] = useState(true);

  const counts = useMemo(() => {
    return services.reduce(
      (acc, s) => {
        acc.total += 1;
        const k = STATUS_META[s.status] ? s.status : "unknown";
        acc[k] += 1;
        return acc;
      },
      { total: 0, down: 0, intermittent: 0, up: 0, unknown: 0 }
    );
  }, [services]);

  const headerTone = counts.down
    ? STATUS_META.down
    : counts.intermittent
    ? STATUS_META.intermittent
    : STATUS_META.up;

  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-100"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${headerTone.dot}`}
            aria-hidden
          />
          <h2 className="text-lg font-semibold text-gray-900">
            Priority {priority}
          </h2>
          <span className="text-sm text-gray-500">
            • {counts.total} services
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline">
            Up {counts.up} · Int {counts.intermittent} · Down {counts.down}
          </span>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>
      {open && (
        <div className="grid gap-3 p-4">
          {services.map((s, i) => (
            <ServiceRow key={`${s.servicename}-${s.location}-${i}`} svc={s} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [services, setServices] = useState(/** @type {Service[]|null} */ null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await fetch("/services.json", { cache: "no-store" });
      if (!res.ok)
        throw new Error(`Failed to fetch services.json (${res.status})`);
      /** @type {unknown} */
      const data = await res.json();
      if (!Array.isArray(data))
        throw new Error("services.json must be an array of objects");
      // Basic normalization/validation
      const clean = data
        .filter((x) => x && typeof x === "object")
        .map((x) => ({
          location: String(x.location ?? ""),
          priority: Number(x.priority ?? 0),
          servicename: String(x.servicename ?? ""),
          status: String(x.status ?? "unknown").toLowerCase(),
        }))
        .sort(
          (a, b) =>
            a.priority - b.priority ||
            a.servicename.localeCompare(b.servicename)
        );
      setServices(clean);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unknown error loading services.json"
      );
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const byPriority = useMemo(() => {
    const m = new Map();
    (services ?? []).forEach((s) => {
      const p = Number.isFinite(s.priority) ? s.priority : 0;
      if (!m.has(p)) m.set(p, []);
      m.get(p).push(s);
    });
    return Array.from(m.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([priority, arr]) => ({ priority, services: arr }));
  }, [services]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Service Status</h1>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                Up
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                Intermittent
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                Down
              </span>
            </div>
            <button
              onClick={load}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 active:scale-[.99]"
              title="Re-fetch /services.json"
            >
              Reload
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        {loading && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-700">
            Loading services…
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
            <div className="mt-1 text-sm text-red-600/80">
              Ensure `services.json` exists at <code>/services.json</code> and
              contains valid JSON.
            </div>
          </div>
        )}

        {byPriority.length === 0 && !loading ? (
          <div className="text-gray-500">No services to display.</div>
        ) : (
          <div className="grid gap-4">
            {byPriority.map(({ priority, services }) => (
              <PriorityGroup
                key={priority}
                priority={priority}
                services={services}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-gray-400">
        <span>© {new Date().getFullYear()} • Status board</span>
      </footer>
    </div>
  );
}

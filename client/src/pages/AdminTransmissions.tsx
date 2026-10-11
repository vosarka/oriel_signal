import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import "./admin-transmissions.css";

type Script = { title: string; mirror: string; threshold: string; gift: string };
const EMPTY: Script = { title: "", mirror: "", threshold: "", gift: "" };

function hoursLeft(due: Date | string) {
  const h = Math.round((new Date(due).getTime() - Date.now()) / 3_600_000);
  return h >= 0 ? `${h}h left` : `${-h}h late`;
}

/** Vos reads each transmission, edits it if needed, and approves. */
export default function AdminTransmissions() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const list = trpc.admin.personalTransmissions.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Script>(EMPTY);
  const refresh = () => void utils.admin.personalTransmissions.list.invalidate();
  const approve = trpc.admin.personalTransmissions.approve.useMutation({ onSuccess: refresh });
  const regenerate = trpc.admin.personalTransmissions.regenerate.useMutation({ onSuccess: refresh });

  const rows = list.data ?? [];
  const selected = rows.find(r => r.id === selectedId) ?? null;

  useEffect(() => {
    setDraft(selected?.script ? (JSON.parse(selected.script) as Script) : EMPTY);
  }, [selected?.id, selected?.script]);

  if (loading) return <Layout><p className="at-wrap">Loading…</p></Layout>;
  if (user?.role !== "admin") return <Layout><p className="at-wrap">Admin access required.</p></Layout>;

  const words = [draft.mirror, draft.threshold, draft.gift].join(" ").trim().split(/\s+/).filter(Boolean).length;

  return (
    <Layout>
      <main className="at-wrap">
        <h1 className="at-title">Transmissions to approve</h1>
        <div className="at-grid">
          <ol className="at-list">
            {rows.map(r => (
              <li key={r.id}>
                <button
                  type="button"
                  className={`at-item${r.id === selectedId ? " is-active" : ""}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <span className="at-item__kind">{r.kind} · {r.source}</span>
                  <span className={`at-item__status at-item__status--${r.status}`}>{r.status}</span>
                  {r.status !== "delivered" && <span className="at-item__due">{hoursLeft(r.dueAt)}</span>}
                </button>
              </li>
            ))}
            {!rows.length && <li className="at-empty">Nothing waiting.</li>}
          </ol>

          {selected && (
            <section className="at-editor" aria-label="Transmission script">
              {selected.failureReason && <p className="at-error">{selected.failureReason}</p>}
              {(["title", "mirror", "threshold", "gift"] as const).map(field => (
                <label key={field} className="at-field">
                  <span>{field}</span>
                  {field === "title" ? (
                    <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
                  ) : (
                    <textarea
                      rows={8}
                      value={draft[field]}
                      onChange={e => setDraft({ ...draft, [field]: e.target.value })}
                    />
                  )}
                </label>
              ))}
              <p className="at-count">{words} words · 280–450</p>
              {approve.error && <p className="at-error">{approve.error.message}</p>}
              <div className="at-actions">
                <button
                  type="button"
                  className="at-btn at-btn--primary"
                  disabled={approve.isPending || !draft.mirror || selected.status === "delivered"}
                  onClick={() => approve.mutate({ id: selected.id, script: draft })}
                >
                  {approve.isPending ? "Voicing…" : "Approve and send"}
                </button>
                <button
                  type="button"
                  className="at-btn"
                  disabled={regenerate.isPending || selected.status === "delivered"}
                  onClick={() => regenerate.mutate({ id: selected.id })}
                >
                  {regenerate.isPending ? "Writing…" : "Regenerate"}
                </button>
                {selected.status === "delivered" && (
                  <a className="at-btn" href={`/t/${selected.accessToken}`} target="_blank" rel="noreferrer">
                    Open
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </Layout>
  );
}

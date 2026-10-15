import { useEffect, useState, Fragment } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import ReadingInputFields, { type ReadingInputValue } from "@/components/ReadingInputFields";
import "./admin-transmissions.css";

type Script = { title: string; mirror: string; threshold: string; gift: string };
const EMPTY: Script = { title: "", mirror: "", threshold: "", gift: "" };

function hoursLeft(due: Date | string) {
  const h = Math.round((new Date(due).getTime() - Date.now()) / 3_600_000);
  return h >= 0 ? `${h}h left` : `${-h}h late`;
}

/** Vos reads each transmission, edits it if needed, and approves. */
/** `embedded`: shown as a tab inside /admin, without its own page frame. */
export default function AdminTransmissions({ embedded = false }: { embedded?: boolean } = {}) {
  const Shell = embedded ? Fragment : Layout;
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const list = trpc.admin.personalTransmissions.list.useQuery(undefined, {
    enabled: user?.role === "admin",
    refetchInterval: 15_000,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Script>(EMPTY);
  const [testInput, setTestInput] = useState<ReadingInputValue>({ intention: "", useMemories: false });
  const refresh = () => void utils.admin.personalTransmissions.list.invalidate();
  const approve = trpc.admin.personalTransmissions.approve.useMutation({ onSuccess: refresh });
  const regenerate = trpc.admin.personalTransmissions.regenerate.useMutation({ onSuccess: refresh });
  const recheck = trpc.admin.personalTransmissions.recheckPayment.useMutation({ onSuccess: refresh });
  const createTest = trpc.admin.personalTransmissions.createTest.useMutation({
    onSuccess: ({ id }) => {
      refresh();
      setSelectedId(id);
    },
  });

  const rows = list.data ?? [];
  const selected = rows.find(r => r.id === selectedId) ?? null;

  useEffect(() => {
    setDraft(selected?.script ? (JSON.parse(selected.script) as Script) : EMPTY);
  }, [selected?.id, selected?.script]);

  if (loading) return <Shell><p className="at-wrap">Loading…</p></Shell>;
  if (user?.role !== "admin") return <Shell><p className="at-wrap">Admin access required.</p></Shell>;

  const words = [draft.mirror, draft.threshold, draft.gift].join(" ").trim().split(/\s+/).filter(Boolean).length;

  return (
    <Shell>
      <main className="at-wrap">
        <h1 className="at-title">Transmissions to approve</h1>
        <p className="at-count"><a href="/admin?tab=lore">Vossari canon →</a></p>
        <div className="at-actions at-top">
          <ReadingInputFields value={testInput} onChange={setTestInput} />
          <button type="button" className="at-btn" disabled={createTest.isPending} onClick={() => createTest.mutate(testInput)}>
            {createTest.isPending ? "Starting…" : "Test transmission for me"}
          </button>
          <span className="at-count">A Mirror for your own account, unpaid. ORIEL writes it in about a minute; the draft appears here on its own.</span>
          {createTest.error && <p className="at-error">{createTest.error.message}</p>}
        </div>
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
              {selected.status === "pending_payment" && (
                <div className="at-actions">
                  <p className="at-count">
                    PayPal order {selected.paypalOrderId}: approved by the Seeker but not captured here. Re-check it.
                  </p>
                  <button
                    type="button"
                    className="at-btn at-btn--primary"
                    disabled={recheck.isPending}
                    onClick={() => recheck.mutate({ id: selected.id })}
                  >
                    {recheck.isPending ? "Checking…" : "Re-check payment"}
                  </button>
                  {recheck.error && <p className="at-error">{recheck.error.message}</p>}
                </div>
              )}
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
                  disabled={
                    approve.isPending ||
                    !draft.mirror ||
                    selected.status === "pending_payment" ||
                    (selected.status === "delivered" && Boolean(selected.hasAudio))
                  }
                  onClick={() => approve.mutate({ id: selected.id, script: draft })}
                >
                  {approve.isPending
                    ? "Voicing…"
                    : selected.status === "delivered"
                      ? "Give it its voice and send again"
                      : "Approve and send"}
                </button>
                <button
                  type="button"
                  className="at-btn"
                  disabled={regenerate.isPending || ["delivered", "pending_payment"].includes(selected.status)}
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
    </Shell>
  );
}

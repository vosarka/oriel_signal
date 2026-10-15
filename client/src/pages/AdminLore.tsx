import { useEffect, useState, Fragment } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import "./admin-transmissions.css";

type Status = "proposed" | "canon" | "rejected";
type Draft = { title: string; body: string; keywords: string };
const EMPTY: Draft = { title: "", body: "", keywords: "" };
const TABS: Array<{ status: Status; label: string }> = [
  { status: "proposed", label: "Proposed by ORIEL" },
  { status: "canon", label: "Canon" },
  { status: "rejected", label: "Rejected" },
];

/** The Vossari canon: ORIEL proposes from conversations, Vos approves. */
/** `embedded`: shown as a tab inside /admin, without its own page frame. */
export default function AdminLore({ embedded = false }: { embedded?: boolean } = {}) {
  const Shell = embedded ? Fragment : Layout;
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [tab, setTab] = useState<Status>("proposed");
  const list = trpc.admin.lore.list.useQuery(
    { status: tab },
    { enabled: user?.role === "admin", refetchInterval: 15_000 }
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const refresh = () => void utils.admin.lore.list.invalidate();
  const save = trpc.admin.lore.save.useMutation({ onSuccess: refresh });
  const setStatus = trpc.admin.lore.setStatus.useMutation({
    onSuccess: () => {
      setSelectedId(null);
      refresh();
    },
  });
  const seed = trpc.admin.lore.seed.useMutation({ onSuccess: refresh });
  const sync = trpc.admin.lore.sync.useMutation();

  const rows = list.data ?? [];
  const selected = rows.find(r => r.id === selectedId) ?? null;

  useEffect(() => {
    setDraft(selected ? { title: selected.title, body: selected.body, keywords: selected.keywords } : EMPTY);
    // Follows the saved row too: the server trims what it stores, so the
    // draft must take the stored values or "Save changes" never clears.
  }, [selected?.id, selected?.title, selected?.body, selected?.keywords]);

  if (loading) return <Shell><p className="at-wrap">Loading…</p></Shell>;
  if (user?.role !== "admin") return <Shell><p className="at-wrap">Admin access required.</p></Shell>;

  const edited =
    selected !== null &&
    (draft.title !== selected.title || draft.body !== selected.body || draft.keywords !== selected.keywords);
  const saveThen = (next?: Status) => {
    if (!selected) return;
    const after = () => next && setStatus.mutate({ id: selected.id, status: next });
    if (edited) save.mutate({ id: selected.id, ...draft }, { onSuccess: after });
    else after();
  };

  return (
    <Shell>
      <main className="at-wrap">
        <h1 className="at-title">Vossari canon</h1>
        <div className="at-actions at-top">
          {TABS.map(t => (
            <button
              key={t.status}
              type="button"
              className={`at-btn${tab === t.status ? " at-btn--primary" : ""}`}
              onClick={() => {
                setTab(t.status);
                setSelectedId(null);
              }}
            >
              {t.label}
            </button>
          ))}
          <button type="button" className="at-btn" disabled={seed.isPending} onClick={() => seed.mutate()}>
            {seed.isPending ? "Importing…" : "Import starting lore"}
          </button>
          <button type="button" className="at-btn" disabled={sync.isPending} onClick={() => sync.mutate()}>
            {sync.isPending ? "Syncing…" : sync.data ? `${sync.data.indexed} in the lore memory` : "Sync lore memory"}
          </button>
          <span className="at-count">
            {seed.data
              ? `${seed.data.added} entries imported.`
              : tab === "proposed"
                ? "When a question is about one of these, ORIEL tells it like canon, unmarked. Edit, make canon, or reject."
                : "Whatever new ORIEL says about the Vossari lands in Proposed."}
          </span>
          {(list.error || seed.error || sync.error || setStatus.error || save.error) && (
            <p className="at-error">
              {(list.error ?? seed.error ?? sync.error ?? setStatus.error ?? save.error)?.message}
              {list.error && /doesn't exist|ER_NO_SUCH_TABLE/i.test(list.error.message) &&
                " — create the vossari_lore table in TiDB (migration 0018)."}
            </p>
          )}
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
                  <span className="at-item__kind">{r.title}</span>
                  <span className="at-item__status">{r.source}</span>
                </button>
              </li>
            ))}
            {!rows.length && !list.error && <li className="at-empty">{list.isLoading ? "Loading…" : "Nothing here."}</li>}
          </ol>

          {selected && (
            <section className="at-editor" aria-label="Lore entry">
              {selected.locked && (
                <p className="at-count">
                  ORIEL's stable core origin: it reaches every conversation from identity.ts, so it is read-only here.
                </p>
              )}
              <label className="at-field">
                <span>title</span>
                <input readOnly={selected.locked} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
              </label>
              <label className="at-field">
                <span>lore</span>
                <textarea readOnly={selected.locked} rows={12} value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} />
              </label>
              <label className="at-field">
                <span>keywords (comma-separated: the words that bring this into a conversation)</span>
                <input readOnly={selected.locked} value={draft.keywords} onChange={e => setDraft({ ...draft, keywords: e.target.value })} />
              </label>
              {!selected.locked && <div className="at-actions">
                {tab !== "canon" && (
                  <button
                    type="button"
                    className="at-btn at-btn--primary"
                    disabled={save.isPending || setStatus.isPending}
                    onClick={() => saveThen("canon")}
                  >
                    Make it canon
                  </button>
                )}
                {edited && (
                  <button type="button" className="at-btn" disabled={save.isPending} onClick={() => saveThen()}>
                    {save.isPending ? "Saving…" : "Save changes"}
                  </button>
                )}
                {tab !== "rejected" && (
                  <button
                    type="button"
                    className="at-btn"
                    disabled={setStatus.isPending}
                    onClick={() => saveThen("rejected")}
                  >
                    {tab === "canon" ? "Remove from canon" : "Reject"}
                  </button>
                )}
              </div>}
            </section>
          )}
        </div>
      </main>
    </Shell>
  );
}

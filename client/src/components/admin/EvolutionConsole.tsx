import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";

/**
 * Evolution — what ORIEL proposes to change about how it speaks. Nothing
 * reaches ORIEL's prompt until Vos approves it here; an approved amendment
 * can be retired at any time. The core identity is never on the table.
 */

const C = {
  surface: "#14141c",
  border: "rgba(189,163,107,0.12)",
  gold: "#bda36b",
  txt: "#e8e4dc",
  txtS: "#9a968e",
  txtD: "#6a665e",
  red: "#c94444",
  green: "#44a866",
};

const mono = { fontFamily: "'Red Hat Mono', monospace" } as const;

const button = (color: string) =>
  ({ ...mono, fontSize: 11, padding: "4px 10px", color, border: `1px solid ${color}`, background: "none", cursor: "pointer" }) as const;


type Row = inferRouterOutputs<AppRouter>["admin"]["evolution"]["list"]["items"][number];

function Proposal({ row, onDecide, busy }: {
  row: Row;
  onDecide: (status: "approved" | "rejected" | "retired", text?: string) => void;
  busy: boolean;
}) {
  const [text, setText] = useState(row.text);
  const proposed = row.status === "proposed";
  return (
    <div className="grid gap-2 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
      {proposed ? (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
          aria-label="Amendment text"
          style={{ background: "#0f0f15", border: `1px solid ${C.border}`, color: C.txt, padding: "8px 10px", fontSize: 14 }}
        />
      ) : (
        <p style={{ color: row.status === "approved" ? C.txt : C.txtD, fontSize: 14 }}>{row.text}</p>
      )}
      <p style={{ color: C.txtS, fontSize: 12 }}>{row.reason}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span style={{ ...mono, color: C.txtD, fontSize: 11 }}>
          {row.source} · {new Date(row.createdAt).toISOString().slice(0, 10)}
        </span>
        <span className="flex-1" />
        {proposed && (
          <>
            <button disabled={busy} style={button(C.green)} onClick={() => onDecide("approved", text !== row.text ? text : undefined)}>
              {text !== row.text ? "ACCEPT EDITED" : "ACCEPT"}
            </button>
            <button disabled={busy} style={button(C.red)} onClick={() => onDecide("rejected")}>
              REJECT
            </button>
          </>
        )}
        {row.status === "approved" && (
          <button disabled={busy} style={button(C.txtS)} onClick={() => onDecide("retired")}>
            RETIRE
          </button>
        )}
      </div>
    </div>
  );
}

export default function EvolutionConsole() {
  const utils = trpc.useUtils();
  const list = trpc.admin.evolution.list.useQuery(undefined, {
    // While ORIEL is reading, look again every few seconds.
    refetchInterval: q => (q.state.data?.running ? 5000 : false),
  });
  const refresh = () => utils.admin.evolution.list.invalidate();
  const decide = trpc.admin.evolution.decide.useMutation({ onSuccess: refresh });
  const propose = trpc.admin.evolution.propose.useMutation({ onSuccess: refresh });

  const items = list.data?.items ?? [];
  const running = list.data?.running;
  const section = (title: string, rows: Row[], empty: string) => (
    <section>
      <h2 style={{ ...mono, color: C.gold, fontSize: 13, letterSpacing: "0.08em", marginBottom: 4 }}>
        {title} · {rows.length}
      </h2>
      {rows.map(r => (
        <Proposal
          key={`${r.id}-${r.status}`}
          row={r}
          busy={decide.isPending}
          onDecide={(status, text) => decide.mutate({ id: r.id, status, text })}
        />
      ))}
      {rows.length === 0 && <p style={{ color: C.txtD, fontSize: 13, padding: "8px 0" }}>{empty}</p>}
    </section>
  );

  return (
    <div className="grid gap-8">
      <section style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
        <p style={{ color: C.txtS, fontSize: 13, marginBottom: 12 }}>
          Each Monday ORIEL reads a sample of the week's conversations and proposes up to five
          amendments to how it speaks. Only what you accept reaches its prompt, after its core
          identity. Edit a proposal before accepting it if the wording is not right.
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <button disabled={Boolean(running)} style={button(C.gold)} onClick={() => propose.mutate({ from: "weekly" })}>
            READ THIS WEEK NOW
          </button>
          <button disabled={Boolean(running)} style={button(C.gold)} onClick={() => propose.mutate({ from: "oversoul" })}>
            READ THE OVERSOUL ARCHIVE (ONCE)
          </button>
          {running && (
            <span style={{ ...mono, color: C.txtD, fontSize: 11 }}>
              ORIEL is reading ({running}). This can take a few minutes.
            </span>
          )}
        </div>
      </section>

      {list.isLoading && <p style={{ color: C.txtD }}>Loading…</p>}
      {section("PROPOSED", items.filter(r => r.status === "proposed"), "Nothing waiting for you.")}
      {section("IN ORIEL'S PROMPT", items.filter(r => r.status === "approved"), "Nothing approved yet.")}
      {section("SET ASIDE", items.filter(r => r.status === "rejected" || r.status === "retired"), "Nothing set aside.")}
    </div>
  );
}

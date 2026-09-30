import { useState } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Patrons — supporters Vos recognises by hand. Donations through the site's
 * hosted PayPal button never reached accounts, so this is how the people
 * who already give are kept past the free threshold. Garden members come
 * from PayPal and are shown here but changed only there.
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

function formatDate(value: Date | string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function standing(row: {
  kind: "garden" | "patron" | null;
  lapsed: boolean | null;
  tier: string;
  subscriptionRenewalDate: Date | string | null;
}) {
  if (row.kind === "garden") return { label: `${row.tier} · PayPal`, color: C.gold };
  if (row.kind === "patron") {
    const until = formatDate(row.subscriptionRenewalDate);
    return { label: until ? `${row.tier} · until ${until}` : row.tier, color: C.green };
  }
  if (row.lapsed) return { label: "Lapsed", color: C.txtD };
  return { label: "Free", color: C.txtS };
}

/** Total donated, in euros. Saved on Enter or when the field loses focus. */
function DonatedField({
  userId,
  donated,
  onSave,
}: {
  userId: number;
  donated: number | null;
  onSave: (userId: number, amount: number) => void;
}) {
  const [value, setValue] = useState(String(donated ?? 0));
  const save = () => {
    const amount = Number(value.replace(",", "."));
    if (Number.isFinite(amount) && amount >= 0 && amount !== Number(donated ?? 0)) {
      onSave(userId, amount);
    }
  };
  return (
    <label className="flex items-center gap-1" style={{ ...mono, color: C.txtD, fontSize: 11 }}>
      €
      <input
        inputMode="decimal"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={e => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        aria-label="Total donated in euros"
        style={{ ...mono, width: 72, background: "#0f0f15", border: `1px solid ${C.border}`, color: C.txt, padding: "3px 6px", fontSize: 12 }}
      />
    </label>
  );
}

export default function PatronsConsole() {
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const [until, setUntil] = useState("");

  const supporters = trpc.admin.patrons.list.useQuery();
  const found = trpc.admin.patrons.find.useQuery(
    { query },
    { enabled: query.trim().length >= 3 }
  );

  const refresh = () => {
    utils.admin.patrons.list.invalidate();
    utils.admin.patrons.find.invalidate();
  };
  const mark = trpc.admin.patrons.mark.useMutation({ onSuccess: refresh });
  const unmark = trpc.admin.patrons.unmark.useMutation({ onSuccess: refresh });
  const setDonated = trpc.admin.patrons.setDonated.useMutation({ onSuccess: refresh });

  const markPatron = (userId: number) =>
    mark.mutate({ userId, until: until ? new Date(`${until}T23:59:59Z`) : null });

  const row = (r: NonNullable<typeof supporters.data>[number]) => {
    const s = standing(r);
    return (
      <div
        key={r.id}
        className="grid items-center gap-3 py-3"
        style={{
          gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr) auto auto",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ color: C.txt, fontSize: 14 }}>{r.name || "—"}</div>
          <div style={{ ...mono, color: C.txtS, fontSize: 12, overflowWrap: "anywhere" }}>
            {r.email}
          </div>
        </div>
        <div style={{ ...mono, color: s.color, fontSize: 12 }}>{s.label}</div>
        <DonatedField
          key={`${r.id}-${r.donated}`}
          userId={r.id}
          donated={r.donated}
          onSave={(userId, amount) => setDonated.mutate({ userId, amount })}
        />
        <div className="flex gap-2 justify-end">
          {r.kind !== "garden" && r.kind !== "patron" && (
            <button
              onClick={() => markPatron(r.id)}
              disabled={mark.isPending}
              style={{ ...mono, fontSize: 11, padding: "4px 10px", color: C.green, border: `1px solid ${C.green}`, background: "none", cursor: "pointer" }}
            >
              MARK PATRON
            </button>
          )}
          {r.kind !== "garden" && (r.kind === "patron" || r.lapsed) && (
            <button
              onClick={() => {
                if (confirm(`Remove patron standing from ${r.email}?`)) {
                  unmark.mutate({ userId: r.id });
                }
              }}
              disabled={unmark.isPending}
              style={{ ...mono, fontSize: 11, padding: "4px 10px", color: C.red, border: `1px solid ${C.red}`, background: "none", cursor: "pointer" }}
            >
              REMOVE
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-8">
      <section style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
        <h2 style={{ ...mono, color: C.gold, fontSize: 13, letterSpacing: "0.08em", marginBottom: 12 }}>
          FIND AN ACCOUNT
        </h2>
        <div className="flex flex-wrap gap-3 items-end mb-2">
          <label className="grid gap-1" style={{ flex: "1 1 260px" }}>
            <span style={{ ...mono, color: C.txtD, fontSize: 11 }}>Email or name (3+ letters)</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="deborah@…"
              style={{ ...mono, background: "#0f0f15", border: `1px solid ${C.border}`, color: C.txt, padding: "8px 10px", fontSize: 13 }}
            />
          </label>
          <label className="grid gap-1">
            <span style={{ ...mono, color: C.txtD, fontSize: 11 }}>Until (empty = open-ended)</span>
            <input
              type="date"
              value={until}
              onChange={e => setUntil(e.target.value)}
              style={{ ...mono, background: "#0f0f15", border: `1px solid ${C.border}`, color: C.txt, padding: "7px 10px", fontSize: 13, colorScheme: "dark" }}
            />
          </label>
        </div>
        <p style={{ color: C.txtD, fontSize: 12, marginBottom: 8 }}>
          A one-time donation opens a 30-day key: set the date 30 days out. The level
          follows the total donated: Seed €1–100 · Keeper €101–400 · Steward €401–1,000 ·
          Pillar over €1,000.
        </p>
        {found.data?.map(row)}
        {query.trim().length >= 3 && found.data?.length === 0 && (
          <p style={{ ...mono, color: C.txtD, fontSize: 12 }}>No account matches.</p>
        )}
      </section>

      <section>
        <h2 style={{ ...mono, color: C.gold, fontSize: 13, letterSpacing: "0.08em", marginBottom: 4 }}>
          SUPPORTERS · {supporters.data?.filter(r => r.kind).length ?? 0} ACTIVE
        </h2>
        {supporters.isLoading && <p style={{ color: C.txtD }}>Loading…</p>}
        {supporters.data?.map(row)}
        {supporters.data?.length === 0 && (
          <p style={{ color: C.txtD, fontSize: 13 }}>No supporters marked yet.</p>
        )}
      </section>
    </div>
  );
}

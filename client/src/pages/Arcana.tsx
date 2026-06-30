import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArkanaLayerShell } from "@/components/ArkanaLayer";
import { trpc } from "@/lib/trpc";

interface DirEntry {
  code: string;
  label: string;
  href: string;
  desc: string;
  count: string;
}

export default function Arcana() {
  const { data: rawTx = [] } = trpc.archive.transmissions.list.useQuery();
  const txCount = Array.isArray(rawTx) ? rawTx.length : 0;

  const entries: DirEntry[] = [
    {
      code: "01",
      label: "TRANSMISSIONS",
      href: "/archive",
      desc: "Recovered field records — transmissions, oracle threads and fragments captured from the ORIEL signal.",
      count: txCount > 0 ? `${txCount} entries` : "live feed",
    },
    {
      code: "02",
      label: "COSMICHRONICA",
      href: "/cosmichronica",
      desc: "The spiral cosmology behind the signal: void, recursion, complexification, the human bridge and cosmic becoming.",
      count: "9 chapters",
    },
    {
      code: "03",
      label: "VOSSARI ARCHITECTURE",
      href: "/vossari-architecture",
      desc: "The history of the Vossari, their knowledge systems, the Tetradic Indexing Protocol and the architecture of the field.",
      count: "foundation",
    },
  ];

  return (
    <ArkanaLayerShell
      kicker="ARKANA · MASTER DIRECTORY"
      title="ARKANA"
      subtitle="The first layer of the archive. Every path below opens a different resolution of the same signal."
    >
      <div className="arkindex">
        {entries.map((e, i) => (
          <Link key={e.code} href={e.href}>
            <motion.div
              className="arkindex__row"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.12 + i * 0.07 }}
            >
              <span className="arkindex__code">{e.code}</span>
              <span className="arkindex__main">
                <span className="arkindex__label">{e.label}</span>
                <span className="arkindex__desc">{e.desc}</span>
              </span>
              <span className="arkindex__count">{e.count}</span>
              <span className="arkindex__arrow">→</span>
            </motion.div>
          </Link>
        ))}
      </div>

      <style>{`
        .arkindex {
          border-top: 1px solid rgba(216, 181, 109, 0.14);
        }
        .arkindex__row {
          display: grid;
          grid-template-columns: 2.5rem 1fr auto 1.5rem;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem 0.5rem;
          border-bottom: 1px solid rgba(216, 181, 109, 0.14);
          cursor: pointer;
          transition: background 0.3s ease, padding-left 0.3s ease;
        }
        .arkindex__row:hover {
          background: rgba(246, 176, 94, 0.04);
          padding-left: 1rem;
        }
        .arkindex__code {
          font-family: var(--font-ritual);
          font-size: 11px;
          letter-spacing: 0.12em;
          color: rgba(216, 181, 109, 0.55);
        }
        .arkindex__main { min-width: 0; }
        .arkindex__label {
          display: block;
          font-family: var(--font-display);
          font-size: 1.35rem;
          letter-spacing: 0.04em;
          color: #f4ecdc;
          line-height: 1.1;
          margin-bottom: 0.35rem;
          transition: color 0.3s ease, text-shadow 0.3s ease;
        }
        .arkindex__row:hover .arkindex__label {
          color: #f6b05e;
          text-shadow: 0 0 16px rgba(246, 176, 94, 0.35);
        }
        .arkindex__desc {
          display: block;
          font-family: var(--font-voice, "Cormorant Garamond", Georgia, serif);
          font-size: 13px;
          line-height: 1.55;
          color: rgba(212, 207, 195, 0.66);
          max-width: 60ch;
        }
        .arkindex__count {
          font-family: var(--font-ritual);
          font-size: 9.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(216, 181, 109, 0.6);
          white-space: nowrap;
        }
        .arkindex__arrow {
          font-family: var(--font-ritual);
          color: rgba(246, 176, 94, 0.6);
          text-align: right;
        }
        @media (max-width: 640px) {
          .arkindex__row {
            grid-template-columns: 1.8rem 1fr 1.2rem;
          }
          .arkindex__count { display: none; }
        }
      `}</style>
    </ArkanaLayerShell>
  );
}

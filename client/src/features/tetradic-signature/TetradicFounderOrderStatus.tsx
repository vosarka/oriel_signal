import "./tetradic-founder-order.css";

export type TetradicFounderOrderPhase =
  | "loading"
  | "capturing"
  | "confirmed"
  | "cancelled"
  | "pending"
  | "error";

export type TetradicFounderOrderStatusProps = Readonly<{
  orderId: number;
  phase: TetradicFounderOrderPhase;
  orderStatus?: string;
  deliveryDueAt?: Date | string | null;
  message?: string;
  actionLabel?: string;
  actionPending?: boolean;
  onAction?: () => void;
}>;

const PHASE_COPY: Record<
  TetradicFounderOrderPhase,
  { register: string; title: string; body: string; glyph: string }
> = {
  loading: {
    register: "Receiver checkpoint",
    title: "Reading your order.",
    body: "The secured receiver record is being opened.",
    glyph: "···",
  },
  capturing: {
    register: "PayPal verification",
    title: "Confirming the payment.",
    body: "ORIEL is verifying the capture directly with PayPal. Keep this page open for a moment.",
    glyph: "↻",
  },
  confirmed: {
    register: "Payment confirmed",
    title: "Your Founder Edition is now in the archive.",
    body: "The receiver record and payment are confirmed. The 48-page edition will be authored personally and sent to your account email.",
    glyph: "✓",
  },
  cancelled: {
    register: "Payment not completed",
    title: "Your details remain saved.",
    body: "No confirmed payment was recorded. You can safely return to PayPal without entering the birth details or questions again.",
    glyph: "—",
  },
  pending: {
    register: "Checkpoint secured",
    title: "Your details are ready for payment.",
    body: "The receiver record is saved. Continue to PayPal when you are ready.",
    glyph: "◇",
  },
  error: {
    register: "Verification interrupted",
    title: "The payment status needs another check.",
    body: "Nothing has been lost. The receiver record remains saved, and the payment can be checked again securely.",
    glyph: "!",
  },
};

function formatDueDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function TetradicFounderOrderStatus({
  orderId,
  phase,
  orderStatus,
  deliveryDueAt,
  message,
  actionLabel,
  actionPending = false,
  onAction,
}: TetradicFounderOrderStatusProps) {
  const copy = PHASE_COPY[phase];
  const dueDate = formatDueDate(deliveryDueAt);

  return (
    <main className="tfe-order" aria-labelledby="tfe-order-title">
      <div className="tfe-order__grain" aria-hidden="true" />
      <header className="tfe-order__masthead">
        <a href="/" aria-label="ORIEL home">
          ORIEL
        </a>
        <span>THE TETRADIC SIGNATURE · FOUNDER EDITION</span>
      </header>

      <section
        className="tfe-order__panel"
        aria-live="polite"
        aria-busy={phase === "loading" || phase === "capturing"}
      >
        <div className="tfe-order__seal" data-phase={phase} aria-hidden="true">
          <span>{copy.glyph}</span>
        </div>

        <div className="tfe-order__copy">
          <p className="tfe-order__eyebrow">{copy.register}</p>
          <h1 id="tfe-order-title">{copy.title}</h1>
          <p className="tfe-order__body">{message ?? copy.body}</p>

          <dl className="tfe-order__register">
            <div>
              <dt>Receiver record</dt>
              <dd>#{String(orderId).padStart(6, "0")}</dd>
            </div>
            {orderStatus ? (
              <div>
                <dt>Archive state</dt>
                <dd>{orderStatus.replaceAll("_", " ")}</dd>
              </div>
            ) : null}
            <div>
              <dt>Edition</dt>
              <dd>48 pages · Founder curated</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>
                {dueDate
                  ? `Personally by email · due ${dueDate}`
                  : "Personally by email · within 5 calendar days"}
              </dd>
            </div>
          </dl>

          {onAction && actionLabel ? (
            <button
              className="tfe-order__action"
              type="button"
              onClick={onAction}
              disabled={actionPending}
            >
              {actionPending ? "Opening secure payment…" : actionLabel}
            </button>
          ) : null}

          <a
            className="tfe-order__return"
            href="/tetradic-signature#tetradic-founder-intake"
          >
            Return to the Founder Edition
          </a>
        </div>
      </section>

      <footer className="tfe-order__footer">
        <span>€81,32 · PayPal verified</span>
        <span>Your Resonance Architecture</span>
      </footer>
    </main>
  );
}

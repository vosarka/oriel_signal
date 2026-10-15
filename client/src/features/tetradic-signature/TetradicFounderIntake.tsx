import { useState, type FormEvent } from "react";
import type {
  TetradicFounderEditionCheckpoint,
  TetradicFounderEditionIntakeValues,
  TetradicFounderEditionProps,
} from "./TetradicFounderEdition";

export const FOUNDER_PRICE = "€81,32";
export const FOUNDER_PAGE_COUNT = 64;
const DELIVERY_WINDOW = "Delivered personally by email within 5 calendar days.";

const EMPTY_INTAKE: TetradicFounderEditionIntakeValues = {
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  birthCountry: "",
  questionOne: "",
  questionTwo: "",
  consentAccepted: false,
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

/**
 * The Founder Edition order: account identity, birth coordinates, two present
 * questions, consent, then PayPal. The same steps and calls as before; only
 * the page around it changed.
 */
export function TetradicFounderIntake({
  isAuthenticated,
  user,
  onRequireLogin,
  onCreateCheckpoint,
  onContinueToPayPal,
}: Omit<TetradicFounderEditionProps, "reducedMotion">) {
  const [values, setValues] = useState<TetradicFounderEditionIntakeValues>(EMPTY_INTAKE);
  const [checkpoint, setCheckpoint] = useState<TetradicFounderEditionCheckpoint | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function updateValue<K extends keyof TetradicFounderEditionIntakeValues>(
    key: K,
    value: TetradicFounderEditionIntakeValues[K]
  ) {
    setValues(current => ({ ...current, [key]: value }));
  }

  async function handleCreateCheckpoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated || !user) {
      onRequireLogin();
      return;
    }
    setIsSaving(true);
    setSubmitError("");
    try {
      setCheckpoint(await onCreateCheckpoint(values));
    } catch (error) {
      setSubmitError(errorMessage(error, "Your details could not be saved. Check the fields and try again."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleContinueToPayPal() {
    if (!checkpoint) return;
    setIsContinuing(true);
    setSubmitError("");
    try {
      await onContinueToPayPal(checkpoint.orderId);
    } catch (error) {
      setSubmitError(errorMessage(error, "Secure payment could not be opened. Your saved details are still intact."));
    } finally {
      setIsContinuing(false);
    }
  }

  return (
    <div className="tbk-intake">
      <aside className="tbk-intake__context">
        <p className="tbk-eyebrow">The order</p>
        <h2 className="tbk-title">Begin your edition</h2>
        <p className="tbk-body">
          Your account says who receives the book. Exact birth details make the calculation. Two questions
          in your own words tell the last part where to listen.
        </p>
        <dl className="tbk-ledger">
          <div>
            <dt>Edition</dt>
            <dd>Founder Edition · one copy</dd>
          </div>
          <div>
            <dt>Length</dt>
            <dd>{FOUNDER_PAGE_COUNT} pages, three parts</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>By email, within 5 days</dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd className="tbk-mono">{FOUNDER_PRICE}</dd>
          </div>
        </dl>
      </aside>

      <div className="tbk-intake__panel" id="tetradic-founder-intake">
        {!isAuthenticated || !user ? (
          <div className="tbk-intake__gate">
            <p className="tbk-eyebrow">Account first</p>
            <h3>{isAuthenticated ? "Reconnect your account." : "Sign in before entering your details."}</h3>
            <p className="tbk-body">Your name and email come from your account and stay read-only here.</p>
            <button className="tbk-button" type="button" onClick={onRequireLogin}>
              {isAuthenticated ? "Reconnect account" : "Sign in to continue"}
            </button>
          </div>
        ) : checkpoint ? (
          <div className="tbk-intake__gate" role="status" aria-live="polite">
            <p className="tbk-eyebrow">Details saved</p>
            <h3>
              Receiver record <span className="tbk-mono">#{String(checkpoint.orderId).padStart(6, "0")}</span>
            </h3>
            <p className="tbk-body">
              {user.name} · {user.email}
            </p>
            <button className="tbk-button" type="button" disabled={isContinuing} onClick={handleContinueToPayPal}>
              {isContinuing ? "Opening secure payment…" : `Buy with PayPal · ${FOUNDER_PRICE}`}
            </button>
            <p className="tbk-note">{DELIVERY_WINDOW}</p>
            {submitError ? (
              <p className="tbk-error" role="alert">
                {submitError}
              </p>
            ) : null}
          </div>
        ) : (
          <form className="tbk-form" onSubmit={handleCreateCheckpoint} aria-busy={isSaving}>
            <fieldset disabled={isSaving}>
              <legend className="tbk-sr-only">Founder Edition receiver details</legend>

              <p className="tbk-form__heading">
                <span>Account identity</span>
                <small>Read-only</small>
              </p>
              <div className="tbk-form__grid">
                <label className="tbk-field">
                  <span>Name</span>
                  <input type="text" value={user.name} readOnly aria-readonly="true" autoComplete="name" />
                </label>
                <label className="tbk-field">
                  <span>Email</span>
                  <input type="email" value={user.email} readOnly aria-readonly="true" autoComplete="email" />
                </label>
              </div>

              <p className="tbk-form__heading">
                <span>Birth coordinates</span>
                <small>Exact values</small>
              </p>
              <div className="tbk-form__grid">
                <label className="tbk-field">
                  <span>Birth date</span>
                  <input
                    type="date"
                    value={values.birthDate}
                    onChange={e => updateValue("birthDate", e.target.value)}
                    autoComplete="bday"
                    required
                  />
                </label>
                <label className="tbk-field">
                  <span>Birth time</span>
                  <input
                    type="time"
                    value={values.birthTime}
                    onChange={e => updateValue("birthTime", e.target.value)}
                    step={60}
                    required
                  />
                </label>
                <label className="tbk-field">
                  <span>Birth city or place</span>
                  <input
                    type="text"
                    value={values.birthPlace}
                    onChange={e => updateValue("birthPlace", e.target.value)}
                    autoComplete="address-level2"
                    placeholder="City or locality"
                    required
                  />
                </label>
                <label className="tbk-field">
                  <span>Birth country</span>
                  <input
                    type="text"
                    value={values.birthCountry}
                    onChange={e => updateValue("birthCountry", e.target.value)}
                    autoComplete="country-name"
                    placeholder="Country"
                    required
                  />
                </label>
              </div>

              <p className="tbk-form__heading">
                <span>Two present questions</span>
                <small>Your own words</small>
              </p>
              <label className="tbk-field">
                <span>Your first question</span>
                <textarea
                  value={values.questionOne}
                  onChange={e => updateValue("questionOne", e.target.value)}
                  rows={3}
                  placeholder="The first question you want the book to meet."
                  required
                />
              </label>
              <label className="tbk-field">
                <span>Your second question</span>
                <textarea
                  value={values.questionTwo}
                  onChange={e => updateValue("questionTwo", e.target.value)}
                  rows={3}
                  placeholder="The second question you want the book to meet."
                  required
                />
              </label>

              <label className="tbk-consent">
                <input
                  type="checkbox"
                  checked={values.consentAccepted}
                  onChange={e => updateValue("consentAccepted", e.target.checked)}
                  required
                />
                <span>
                  I consent to ORIEL using this birth and intake data to prepare my Founder Edition. I understand
                  that it is not medical, legal, therapeutic, financial, or predictive guidance.
                </span>
              </label>

              <div className="tbk-form__action">
                <div>
                  <span className="tbk-mono">{FOUNDER_PRICE}</span>
                  <small>{DELIVERY_WINDOW}</small>
                </div>
                <button className="tbk-button" type="submit" disabled={isSaving}>
                  {isSaving ? "Saving details…" : "Save details & continue"}
                </button>
              </div>

              {submitError ? (
                <p className="tbk-error" role="alert">
                  {submitError}
                </p>
              ) : null}
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );
}

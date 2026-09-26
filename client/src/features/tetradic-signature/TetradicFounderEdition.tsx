import React, {
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./tetradic-founder-edition.css";

gsap.registerPlugin(ScrollTrigger);

export type TetradicFounderEditionUser = Readonly<{
  name: string;
  email: string;
}>;

export type TetradicFounderEditionIntakeValues = Readonly<{
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthCountry: string;
  questionOne: string;
  questionTwo: string;
  consentAccepted: boolean;
}>;

export type TetradicFounderEditionCheckpoint = Readonly<{
  orderId: number;
  savedAt?: string;
}>;

export type TetradicFounderEditionProps = Readonly<{
  isAuthenticated: boolean;
  user: TetradicFounderEditionUser | null;
  reducedMotion?: boolean;
  onRequireLogin: () => void;
  onCreateCheckpoint: (
    values: TetradicFounderEditionIntakeValues
  ) =>
    | TetradicFounderEditionCheckpoint
    | Promise<TetradicFounderEditionCheckpoint>;
  onContinueToPayPal: (orderId: number) => void | Promise<void>;
}>;

const PRICE = "€81,32";
const DELIVERY_WINDOW = "Delivered personally by email within 5 calendar days.";
const PAGE_COUNT = 64;
const BOOK_ASSETS = "/assets/tetradic-signature/book-v2";

/**
 * Part I, the manual. It holds no receiver data, so it is the only part
 * shown publicly — Parts II and III are someone's record. Each chapter is
 * a spread: the obsidian plate, then the ivory page that explains it.
 * Chapter one opens the page as the large spread; these follow it.
 */
const SHOWN_CHAPTERS = [
  { chapter: 2, title: "Eighty-Eight Degrees", line: "The second moment is not chosen. It is found." },
  { chapter: 3, title: "The Field of Sixty-Four", line: "The wheel does not describe you. It describes what is possible." },
  { chapter: 7, title: "Eight Centres", line: "Positions are not scattered. They collect." },
  { chapter: 8, title: "What Closes a Circuit", line: "A position alone does nothing. Two positions can close a circuit." },
  { chapter: 10, title: "What the System Does Not Say", line: "An instrument becomes credible when it names its limits." },
].map(({ chapter, ...rest }) => {
  const number = String(chapter).padStart(2, "0");
  const firstPage = 7 + chapter * 2;
  return {
    ...rest,
    number,
    pages: `${String(firstPage).padStart(2, "0")}–${String(firstPage + 1).padStart(2, "0")}`,
    plate: `${BOOK_ASSETS}/ch${number}-plate.webp`,
    page: `${BOOK_ASSETS}/ch${number}-page.webp`,
  };
});

const BOOK_PARTS = [
  {
    numeral: "I",
    title: "The System",
    pages: "09–28",
    body: "Ten chapters that teach the instrument. Nothing in this half is about you.",
  },
  {
    numeral: "II",
    title: "The Record",
    pages: "31–52",
    body: "The same ten chapters again, now with your numbers — plus one: the central contradiction.",
  },
  {
    numeral: "III",
    title: "What I Saw",
    pages: "55–62",
    body: "My voice, not the system's: what I noticed, what I would watch, what would prove me wrong.",
  },
] as const;

const EMPTY_INTAKE: TetradicFounderEditionIntakeValues = {
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  birthCountry: "",
  questionOne: "",
  questionTwo: "",
  consentAccepted: false,
};

const PRECISION_REGISTER = [
  {
    value: "64",
    label: "Codon positions",
    note: "The complete interpretive field",
  },
  {
    value: "5.625°",
    label: "Per codon",
    note: "One sixty-fourth of the zodiac",
  },
  {
    value: "1.40625°",
    label: "Per facet",
    note: "Four exact states inside each codon",
  },
  {
    value: "88.0000°",
    label: "Design descent",
    note: "Exact solar-longitude separation",
  },
] as const;
const ORBITAL_TICKS = Array.from({ length: 32 }, (_, index) => index);

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

export function TetradicFounderEdition({
  isAuthenticated,
  user,
  reducedMotion = false,
  onRequireLogin,
  onCreateCheckpoint,
  onContinueToPayPal,
}: TetradicFounderEditionProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [values, setValues] =
    useState<TetradicFounderEditionIntakeValues>(EMPTY_INTAKE);
  const [checkpoint, setCheckpoint] =
    useState<TetradicFounderEditionCheckpoint | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;

    const context = gsap.context(() => {
      const choreography = gsap.timeline({
        defaults: { duration: 0.8, ease: "power3.out" },
        scrollTrigger: {
          trigger: root,
          start: "top 86%",
          toggleActions: "play none none none",
          once: true,
        },
      });

      choreography
        .from("[data-tfe-intro-reveal]", {
          opacity: 0,
          y: 28,
          stagger: 0.09,
        })
        .from(
          "[data-tfe-tetrad-card]",
          {
            y: 22,
            duration: 0.72,
            stagger: 0.035,
          },
          "-=0.48"
        )
        .from(
          "[data-tfe-register]",
          {
            y: 18,
            duration: 0.68,
            stagger: 0.06,
          },
          "-=0.42"
        );
    }, root);

    return () => context.revert();
  }, [reducedMotion]);

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
      const nextCheckpoint = await onCreateCheckpoint(values);
      setCheckpoint(nextCheckpoint);
    } catch (error) {
      setSubmitError(
        errorMessage(
          error,
          "Your details could not be saved. Check the fields and try again."
        )
      );
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
      setSubmitError(
        errorMessage(
          error,
          "Secure payment could not be opened. Your saved details are still intact."
        )
      );
    } finally {
      setIsContinuing(false);
    }
  }

  return (
    <section
      ref={rootRef}
      className="tfe"
      data-reduced-motion={String(reducedMotion)}
      aria-labelledby="tfe-title"
    >
      <header className="tfe__intro">
        <figure className="tfe__hero-plate" data-tfe-intro-reveal>
          <img
            src={`${BOOK_ASSETS}/cover.webp`}
            alt="The cover: The Tetradic Signature, Founder Edition, with the receiver's name set below a gold and ivory wheel."
            decoding="async"
            fetchPriority="high"
          />
        </figure>
        <div className="tfe__intro-main">
        <div className="tfe__intro-copy">
          <p className="tfe__eyebrow" data-tfe-intro-reveal>
            ORIEL Signal · Founder Archive
          </p>
          <h2
            className="tfe__title"
            id="tfe-title"
            data-tfe-intro-reveal
            aria-label="THE TETRADIC SIGNATURE — FOUNDER EDITION"
          >
            <span className="tfe__title-product" aria-hidden="true">
              THE TETRADIC SIGNATURE —
            </span>
            <span className="tfe__title-edition" aria-hidden="true">
              FOUNDER EDITION
            </span>
          </h2>
          <p className="tfe__voice" data-tfe-intro-reveal>
            Your Resonance Architecture
          </p>
          <p className="tfe__lede" data-tfe-intro-reveal>
            A founder-curated reading anchored in your birth coordinates and
            present questions. The calculation establishes the structure;
            personal interpretation gives it human meaning.
          </p>
        </div>

        <dl
          className="tfe__edition-register"
          aria-label="Founder Edition details"
          data-tfe-intro-reveal
        >
          <div className="tfe__edition-price">
            <dt>Founder price</dt>
            <dd>{PRICE}</dd>
          </div>
          <div>
            <dt>Architecture</dt>
            <dd>
              3 parts · {PAGE_COUNT} pages
            </dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>Personally by email · within 5 calendar days</dd>
          </div>
        </dl>
        <a
          className="tfe__button tfe__button--primary tfe__hero-cta"
          href="#tetradic-founder-intake"
        >
          Begin your reading · {PRICE}
        </a>
        </div>
      </header>

      <section
        className="tfe__opus"
        aria-labelledby="tfe-opus-title"
        data-tfe-register
      >
        <div className="tfe__opus-intro" data-tfe-intro-reveal>
          <p className="tfe__eyebrow">The object itself</p>
          <h3 id="tfe-opus-title">A book, set to your coordinates.</h3>
          <p>
            Sixty-four pages in three parts. The spread below is from the
            manual, exactly as it prints — the manual is the same for every
            receiver. Your record is calculated after you order, and seen by
            no one else.
          </p>
        </div>

        <figure className="tfe__book" data-tfe-intro-reveal>
          <span className="tfe__book-lamp" aria-hidden="true" />
          <div className="tfe__book-body" data-book-plate>
            <div className="tfe__book-leaf tfe__book-leaf--verso">
              <img
                src={`${BOOK_ASSETS}/ch01-plate.webp`}
                alt="Plate for chapter one, Two Moments: a solid gold disc above a ring broken into four arcs."
                loading="lazy"
                decoding="async"
              />
            </div>
            <span className="tfe__book-gutter" aria-hidden="true" />
            <div className="tfe__book-leaf tfe__book-leaf--recto">
              <img
                src={`${BOOK_ASSETS}/ch01-page.webp`}
                alt="Chapter one, Two Moments: “You were not born once. The sky was read twice.”"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          <figcaption className="tfe__book-legend">
            <span>Page 09 · Plate</span>
            <span className="tfe__book-legend-seal">
              Parts II and III are calculated for you
            </span>
            <span>Page 10 · Two Moments</span>
          </figcaption>
        </figure>
      </section>

      <section
        className="tfe__tetrads"
        aria-labelledby="tfe-tetrads-title"
        aria-describedby="tfe-tetrads-description"
      >
        <div className="tfe__section-heading" data-tfe-intro-reveal>
          <p className="tfe__eyebrow">The complete book</p>
          <h3 id="tfe-tetrads-title">Learn the chapter. Then see it in you.</h3>
          <p id="tfe-tetrads-description">
            {BOOK_PARTS.map(part => (
              <span className="tfe__part-line" key={part.numeral}>
                <strong>
                  Part {part.numeral} · {part.title}
                </strong>{" "}
                · pages {part.pages} — {part.body}
              </span>
            ))}
          </p>
        </div>

        <div
          className="tfe__tetrad-rail tfe__tetrad-rail--chapters"
          role="list"
          aria-label="Chapters from the manual"
        >
          {SHOWN_CHAPTERS.map(chapter => (
            <article
              className="tfe__tetrad-card tfe__tetrad-card--plate"
              key={chapter.number}
              role="listitem"
              data-tfe-tetrad-card
            >
              <div className="tfe__chapter-spread" aria-hidden="true">
                <img src={chapter.plate} alt="" loading="lazy" decoding="async" />
                <img src={chapter.page} alt="" loading="lazy" decoding="async" />
              </div>
              <div className="tfe__tetrad-card-top">
                <span>Chapter</span>
                <strong>{chapter.number}</strong>
              </div>
              <h4>{chapter.title}</h4>
              <p>{chapter.line}</p>
              <span className="tfe__tetrad-pages">Pages {chapter.pages}</span>
            </article>
          ))}
          <article
            className="tfe__tetrad-card tfe__tetrad-card--sealed"
            role="listitem"
            data-tfe-tetrad-card
          >
            <div className="tfe__tetrad-card-top">
              <span>Parts</span>
              <strong>II · III</strong>
            </div>
            <h4>Your record, sealed</h4>
            <p>
              Eleven chapters calculated from your birth, and four in my own
              voice. Written for you, shown to no one else.
            </p>
            <span className="tfe__tetrad-pages">Pages 29–64</span>
          </article>
        </div>

        <p className="tfe__mobile-rail-note" aria-hidden="true">
          Swipe the chapters
        </p>
      </section>

      <section
        className="tfe__precision"
        aria-labelledby="tfe-precision-title"
        data-tfe-register
      >
        <figure
          className="tfe__orbital-instrument"
          aria-labelledby="tfe-orbital-caption"
        >
          <div
            className="tfe__orbital-seal"
            role="img"
            aria-label="Orbital precision instrument for the 64-codon field"
          >
            <span className="tfe__orbital-haze" aria-hidden="true" />
            <span
              className="tfe__orbital-ring tfe__orbital-ring--one"
              aria-hidden="true"
            />
            <span
              className="tfe__orbital-ring tfe__orbital-ring--two"
              aria-hidden="true"
            />
            <span
              className="tfe__orbital-ring tfe__orbital-ring--three"
              aria-hidden="true"
            />
            <span
              className="tfe__orbital-axis tfe__orbital-axis--horizontal"
              aria-hidden="true"
            />
            <span
              className="tfe__orbital-axis tfe__orbital-axis--vertical"
              aria-hidden="true"
            />
            <span className="tfe__orbital-core">
              <strong>64</strong>
              <small>Codon field</small>
            </span>
            <span className="tfe__orbital-ticks" aria-hidden="true">
              {ORBITAL_TICKS.map(tick => (
                <i
                  key={tick}
                  style={{ transform: `rotate(${tick * 11.25}deg)` }}
                />
              ))}
            </span>
            <i
              className="tfe__orbital-node tfe__orbital-node--north"
              aria-hidden="true"
            />
            <i
              className="tfe__orbital-node tfe__orbital-node--east"
              aria-hidden="true"
            />
            <i
              className="tfe__orbital-node tfe__orbital-node--south"
              aria-hidden="true"
            />
            <i
              className="tfe__orbital-node tfe__orbital-node--west"
              aria-hidden="true"
            />
          </div>
          <figcaption id="tfe-orbital-caption">
            64 positions · 32 resonance links · 4 facets per codon
          </figcaption>
        </figure>

        <div className="tfe__precision-content">
          <div className="tfe__section-heading tfe__section-heading--precision">
            <p className="tfe__eyebrow">Precision register</p>
            <h3 id="tfe-precision-title">The structure is calculated.</h3>
            <p>
              Four fixed measures hold the reading to one reproducible
              astronomical substrate. Interpretation begins after the numbers
              are established.
            </p>
          </div>

          <dl className="tfe__precision-grid">
            {PRECISION_REGISTER.map(item => (
              <div className="tfe__precision-item" key={item.value}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
                <p>{item.note}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        className="tfe__intake"
        id="tetradic-founder-intake"
        aria-labelledby="tfe-intake-title"
        data-tfe-register
      >
        <aside className="tfe__intake-context">
          <p className="tfe__eyebrow">Your receiver record</p>
          <h3 id="tfe-intake-title">Anchor the reading.</h3>
          <p className="tfe__intake-copy">
            Your account establishes who receives the work. Exact birth details
            establish the calculation. Two present-tense questions establish
            where the reading should listen.
          </p>

          <dl className="tfe__delivery-register">
            <div>
              <dt>Edition</dt>
              <dd>Founder Edition</dd>
            </div>
            <div>
              <dt>Length</dt>
              <dd>{PAGE_COUNT} authored pages</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>Personal email · 5 calendar days</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{PRICE}</dd>
            </div>
          </dl>
        </aside>

        <div className="tfe__intake-panel">
          {!isAuthenticated || !user ? (
            <div className="tfe__login-gate">
              <p className="tfe__status-label">Account checkpoint</p>
              <h4>
                {isAuthenticated
                  ? "Reconnect your account identity."
                  : "Sign in before entering personal details."}
              </h4>
              <p>
                Name and email come directly from your account and remain
                read-only in this record.
              </p>
              <button
                className="tfe__button tfe__button--primary"
                type="button"
                onClick={onRequireLogin}
              >
                {isAuthenticated ? "Reconnect account" : "Sign in to continue"}
              </button>
            </div>
          ) : checkpoint ? (
            <div className="tfe__checkpoint" role="status" aria-live="polite">
              <p className="tfe__status-label">Checkpoint secured</p>
              <h4>Your details are saved.</h4>
              <p>
                Receiver record{" "}
                <strong>#{String(checkpoint.orderId).padStart(6, "0")}</strong>{" "}
                is ready for secure payment.
              </p>

              <div className="tfe__checkpoint-identity">
                <span>{user.name}</span>
                <span>{user.email}</span>
              </div>

              <button
                className="tfe__button tfe__button--primary"
                type="button"
                disabled={isContinuing}
                onClick={handleContinueToPayPal}
              >
                {isContinuing
                  ? "Opening secure payment…"
                  : `Buy with PayPal · ${PRICE}`}
              </button>
              <p className="tfe__button-note">{DELIVERY_WINDOW}</p>

              {submitError ? (
                <p className="tfe__form-error" role="alert">
                  {submitError}
                </p>
              ) : null}
            </div>
          ) : (
            <form
              className="tfe__form"
              onSubmit={handleCreateCheckpoint}
              aria-busy={isSaving}
            >
              <fieldset disabled={isSaving}>
                <legend className="tfe__sr-only">
                  Founder Edition receiver details
                </legend>

                <div className="tfe__form-section">
                  <div className="tfe__form-section-heading">
                    <span>Account identity</span>
                    <small>Read-only</small>
                  </div>
                  <div className="tfe__form-grid">
                    <label className="tfe__field">
                      <span>Name</span>
                      <input
                        type="text"
                        value={user.name}
                        readOnly
                        aria-readonly="true"
                        autoComplete="name"
                      />
                    </label>
                    <label className="tfe__field">
                      <span>Email</span>
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        aria-readonly="true"
                        autoComplete="email"
                      />
                    </label>
                  </div>
                </div>

                <div className="tfe__form-section">
                  <div className="tfe__form-section-heading">
                    <span>Birth coordinates</span>
                    <small>Exact values</small>
                  </div>
                  <div className="tfe__form-grid">
                    <label className="tfe__field">
                      <span>Birth date</span>
                      <input
                        type="date"
                        value={values.birthDate}
                        onChange={event =>
                          updateValue("birthDate", event.target.value)
                        }
                        autoComplete="bday"
                        required
                      />
                    </label>
                    <label className="tfe__field">
                      <span>Birth time</span>
                      <input
                        type="time"
                        value={values.birthTime}
                        onChange={event =>
                          updateValue("birthTime", event.target.value)
                        }
                        step={60}
                        required
                      />
                    </label>
                    <label className="tfe__field">
                      <span>Birth city or place</span>
                      <input
                        type="text"
                        value={values.birthPlace}
                        onChange={event =>
                          updateValue("birthPlace", event.target.value)
                        }
                        autoComplete="address-level2"
                        placeholder="City or locality"
                        required
                      />
                    </label>
                    <label className="tfe__field">
                      <span>Birth country</span>
                      <input
                        type="text"
                        value={values.birthCountry}
                        onChange={event =>
                          updateValue("birthCountry", event.target.value)
                        }
                        autoComplete="country-name"
                        placeholder="Country"
                        required
                      />
                    </label>
                  </div>
                </div>

                <div className="tfe__form-section">
                  <div className="tfe__form-section-heading">
                    <span>Present questions</span>
                    <small>Your own words</small>
                  </div>
                  <label className="tfe__field tfe__field--wide">
                    <span>Your first question</span>
                    <textarea
                      value={values.questionOne}
                      onChange={event =>
                        updateValue("questionOne", event.target.value)
                      }
                      rows={4}
                      placeholder="Write the first question you want the reading to meet."
                      required
                    />
                  </label>
                  <label className="tfe__field tfe__field--wide">
                    <span>Your second question</span>
                    <textarea
                      value={values.questionTwo}
                      onChange={event =>
                        updateValue("questionTwo", event.target.value)
                      }
                      rows={4}
                      placeholder="Write the second question you want the reading to meet."
                      required
                    />
                  </label>
                </div>

                <label className="tfe__consent">
                  <input
                    type="checkbox"
                    checked={values.consentAccepted}
                    onChange={event =>
                      updateValue("consentAccepted", event.target.checked)
                    }
                    required
                  />
                  <span>
                    I consent to ORIEL using this birth and intake data to
                    prepare my symbolic Founder Edition reading. I understand
                    that it is not medical, legal, therapeutic, financial, or
                    predictive guidance.
                  </span>
                </label>

                <div className="tfe__form-action">
                  <div>
                    <span>{PRICE}</span>
                    <small>{DELIVERY_WINDOW}</small>
                  </div>
                  <button
                    className="tfe__button tfe__button--primary"
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving details…" : "Save details & continue"}
                  </button>
                </div>

                {submitError ? (
                  <p className="tfe__form-error" role="alert">
                    {submitError}
                  </p>
                ) : null}
              </fieldset>
            </form>
          )}
        </div>
      </section>
    </section>
  );
}

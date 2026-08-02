import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FileUp, MailCheck, PenLine, Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const C = {
  bg: "#050505",
  panel: "#0a0907",
  border: "rgba(225,198,139,0.18)",
  gold: "#d8b56d",
  text: "#fff7e6",
  muted: "rgba(244,231,194,0.62)",
  red: "#f1b5a8",
};

type DateValue = Date | string;

export type AdminSignatureLetterBundle = {
  order: {
    id: number;
    userId: number;
    productType: "glimpse" | "founding" | "tetradic_founder_edition";
    status: string;
    priceEur: number;
    currency: string;
    paymentProvider: "stripe" | "paypal";
    paypalOrderId: string | null;
    paypalCaptureId: string | null;
    paidAt: DateValue | null;
    deliveryDueAt: DateValue | null;
    createdAt: DateValue;
  };
  intake: {
    name: string;
    email: string;
    focusQuestion: string;
    questionOne: string | null;
    questionTwo: string | null;
    preferredTone: string;
    avoidAssumptions: string | null;
    consentAccepted: boolean;
    consentAcceptedAt: DateValue | null;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    birthCountry: string;
    timezone: string;
  } | null;
  snapshot: {
    normalizedSignatureJson: unknown;
    engineVersion: number;
  } | null;
  draft: {
    markdown: string;
    finalPdfStorageKey: string | null;
  } | null;
};

type Bundle = AdminSignatureLetterBundle;

export default function AdminSignatureLetters() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const list = trpc.admin.signatureLetters.listOrders.useQuery(undefined, {
    enabled: Boolean(user?.role === "admin"),
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedFromList = useMemo(
    () =>
      (list.data as Bundle[] | undefined)?.find(
        bundle => bundle.order.id === selectedId
      ) ?? (list.data as Bundle[] | undefined)?.[0],
    [list.data, selectedId]
  );
  const selected = trpc.admin.signatureLetters.getOrder.useQuery(
    { orderId: selectedFromList?.order.id ?? 0 },
    { enabled: Boolean(selectedFromList?.order.id && user?.role === "admin") }
  );
  const bundle = (selected.data ?? selectedFromList) as Bundle | undefined;
  const [draftMarkdown, setDraftMarkdown] = useState("");

  const refresh = async () => {
    await utils.admin.signatureLetters.listOrders.invalidate();
    if (bundle?.order.id) {
      await utils.admin.signatureLetters.getOrder.invalidate({
        orderId: bundle.order.id,
      });
    }
  };

  const generateSnapshot =
    trpc.admin.signatureLetters.generateSnapshot.useMutation({
      onSuccess: refresh,
    });
  const generateDraft = trpc.admin.signatureLetters.generateDraft.useMutation({
    onSuccess: async draft => {
      setDraftMarkdown(draft?.markdown ?? "");
      await refresh();
    },
  });
  const saveDraft = trpc.admin.signatureLetters.saveDraft.useMutation({
    onSuccess: refresh,
  });
  const inCuration = trpc.admin.signatureLetters.markInCuration.useMutation({
    onSuccess: refresh,
  });
  const uploadPdf = trpc.admin.signatureLetters.uploadFinalPdf.useMutation({
    onSuccess: refresh,
  });
  const delivered = trpc.admin.signatureLetters.markDelivered.useMutation({
    onSuccess: refresh,
  });
  const followup = trpc.admin.signatureLetters.markFollowupUsed.useMutation({
    onSuccess: refresh,
  });
  const founderInProgress =
    trpc.admin.signatureLetters.markFounderEditionInProgress.useMutation({
      onSuccess: refresh,
    });
  const founderDelivered =
    trpc.admin.signatureLetters.markFounderEditionDelivered.useMutation({
      onSuccess: refresh,
    });

  useEffect(() => {
    setDraftMarkdown(bundle?.draft?.markdown ?? "");
  }, [bundle?.draft?.markdown]);

  async function onPdfChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !bundle) return;
    const base64 = await fileToBase64(file);
    uploadPdf.mutate({
      orderId: bundle.order.id,
      fileName: file.name,
      mimeType: file.type || "application/pdf",
      base64,
    });
  }

  const isFounderEdition =
    bundle?.order.productType === "tetradic_founder_edition";
  const workflowError = mutationError(
    isFounderEdition
      ? [founderInProgress, founderDelivered]
      : [
          generateSnapshot,
          generateDraft,
          saveDraft,
          inCuration,
          uploadPdf,
          delivered,
          followup,
        ]
  );

  if (loading) {
    return (
      <Layout>
        <div className="p-10">Loading...</div>
      </Layout>
    );
  }

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="p-10" style={{ color: C.red }}>
          Admin access required.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section
        className="min-h-screen px-5 py-10 md:px-10"
        style={{ background: C.bg }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex items-center justify-between gap-5">
            <div>
              <div
                className="text-[11px] uppercase tracking-[0.32em]"
                style={{ color: C.gold }}
              >
                Architect Console
              </div>
              <h1
                className="mt-3 font-serif text-4xl"
                style={{ color: C.text }}
              >
                Signature Letters
              </h1>
            </div>
            {list.isFetching && (
              <Spinner size={18} label="Loading signature letters" />
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <aside
              className="border"
              style={{ borderColor: C.border, background: C.panel }}
            >
              {(list.data as Bundle[] | undefined)?.map(item => (
                <button
                  key={item.order.id}
                  type="button"
                  onClick={() => setSelectedId(item.order.id)}
                  className="block w-full border-b p-4 text-left"
                  style={{
                    borderColor: C.border,
                    background:
                      item.order.id === bundle?.order.id
                        ? "rgba(225,198,139,0.09)"
                        : "transparent",
                  }}
                >
                  <div
                    className="flex justify-between gap-4 text-sm"
                    style={{ color: C.text }}
                  >
                    <span>#{item.order.id}</span>
                    <span>€{item.order.priceEur}</span>
                  </div>
                  <div
                    className="mt-2 text-xs uppercase tracking-[0.16em]"
                    style={{ color: C.gold }}
                  >
                    {item.order.productType} / {item.order.status}
                  </div>
                  <div
                    className="mt-2 truncate text-sm"
                    style={{ color: C.muted }}
                  >
                    {item.intake?.email ?? "intake pending"}
                  </div>
                </button>
              ))}
              {!list.data?.length && (
                <div className="p-5 text-sm" style={{ color: C.muted }}>
                  No Signature Letter orders yet.
                </div>
              )}
            </aside>

            <main
              className="border p-5 md:p-7"
              style={{ borderColor: C.border, background: C.panel }}
            >
              {!bundle ? (
                <div style={{ color: C.muted }}>Select an order.</div>
              ) : (
                <div>
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2
                        className="font-serif text-3xl"
                        style={{ color: C.text }}
                      >
                        Order #{bundle.order.id}
                      </h2>
                      <div
                        className="mt-2 text-sm uppercase tracking-[0.18em]"
                        style={{ color: C.gold }}
                      >
                        {bundle.order.productType} / {bundle.order.status}
                      </div>
                    </div>
                    {!isFounderEdition ? (
                      <div className="flex flex-wrap gap-2">
                        <Action
                          onClick={() =>
                            generateSnapshot.mutate({
                              orderId: bundle.order.id,
                            })
                          }
                          disabled={
                            !bundle.intake?.consentAccepted ||
                            generateSnapshot.isPending
                          }
                        >
                          <Sparkles size={14} /> Snapshot
                        </Action>
                        <Action
                          onClick={() =>
                            generateDraft.mutate({
                              orderId: bundle.order.id,
                            })
                          }
                          disabled={!bundle.snapshot || generateDraft.isPending}
                        >
                          <PenLine size={14} /> Draft
                        </Action>
                        <Action
                          onClick={() =>
                            inCuration.mutate({ orderId: bundle.order.id })
                          }
                          disabled={!bundle.draft || inCuration.isPending}
                        >
                          In curation
                        </Action>
                      </div>
                    ) : null}
                  </div>

                  {isFounderEdition ? (
                    <FounderEditionAdminOrder
                      bundle={bundle}
                      startPending={founderInProgress.isPending}
                      deliveryPending={founderDelivered.isPending}
                      onStartCuration={() =>
                        founderInProgress.mutate({
                          orderId: bundle.order.id,
                        })
                      }
                      onMarkDelivered={() =>
                        founderDelivered.mutate({
                          orderId: bundle.order.id,
                        })
                      }
                    />
                  ) : (
                    <>
                      <div className="grid gap-5 xl:grid-cols-2">
                        <Panel title="Intake">
                          {bundle.intake ? (
                            <div
                              className="space-y-2 text-sm leading-6"
                              style={{ color: C.muted }}
                            >
                              <p>
                                <b style={{ color: C.text }}>
                                  {bundle.intake.name}
                                </b>{" "}
                                / {bundle.intake.email}
                              </p>
                              <p>
                                {bundle.intake.birthDate}{" "}
                                {bundle.intake.birthTime},{" "}
                                {bundle.intake.birthPlace},{" "}
                                {bundle.intake.birthCountry}
                              </p>
                              <p>Timezone: {bundle.intake.timezone}</p>
                              <p>Focus: {bundle.intake.focusQuestion}</p>
                              <p>Tone: {bundle.intake.preferredTone}</p>
                              <p>
                                Avoid:{" "}
                                {bundle.intake.avoidAssumptions || "None"}
                              </p>
                              <p>
                                Consent:{" "}
                                {bundle.intake.consentAccepted ? "yes" : "no"}
                              </p>
                            </div>
                          ) : (
                            <p style={{ color: C.muted }}>
                              Intake has not been submitted.
                            </p>
                          )}
                        </Panel>

                        <Panel title="Normalized Snapshot">
                          <pre
                            className="max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-5"
                            style={{ color: C.muted }}
                          >
                            {bundle.snapshot
                              ? JSON.stringify(
                                  bundle.snapshot.normalizedSignatureJson,
                                  null,
                                  2
                                )
                              : "No snapshot generated yet."}
                          </pre>
                        </Panel>
                      </div>

                      <Panel title="Draft markdown">
                        <textarea
                          value={draftMarkdown}
                          onChange={event =>
                            setDraftMarkdown(event.target.value)
                          }
                          rows={18}
                          className="w-full border bg-transparent p-4 text-sm leading-6 outline-none"
                          style={{ borderColor: C.border, color: C.text }}
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Action
                            onClick={() =>
                              saveDraft.mutate({
                                orderId: bundle.order.id,
                                markdown: draftMarkdown,
                              })
                            }
                            disabled={!draftMarkdown || saveDraft.isPending}
                          >
                            Save draft
                          </Action>
                          <label
                            className="inline-flex items-center gap-2 border px-4 py-2 text-xs uppercase tracking-[0.16em]"
                            style={{ borderColor: C.border, color: C.gold }}
                          >
                            <FileUp size={14} />
                            Upload final PDF
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={onPdfChange}
                            />
                          </label>
                          <Action
                            onClick={() =>
                              delivered.mutate({ orderId: bundle.order.id })
                            }
                            disabled={
                              !bundle.draft?.finalPdfStorageKey ||
                              delivered.isPending
                            }
                          >
                            <MailCheck size={14} /> Mark delivered
                          </Action>
                          <Action
                            onClick={() =>
                              followup.mutate({
                                orderId: bundle.order.id,
                                notes: "Follow-up clarification used.",
                              })
                            }
                            disabled={
                              bundle.order.productType !== "founding" ||
                              followup.isPending
                            }
                          >
                            Follow-up used
                          </Action>
                        </div>
                      </Panel>
                    </>
                  )}

                  {workflowError ? (
                    <div className="mt-4 text-sm" style={{ color: C.red }}>
                      {workflowError}
                    </div>
                  ) : null}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export function FounderEditionAdminOrder({
  bundle,
  startPending,
  deliveryPending,
  onStartCuration,
  onMarkDelivered,
}: {
  bundle: AdminSignatureLetterBundle;
  startPending: boolean;
  deliveryPending: boolean;
  onStartCuration: () => void;
  onMarkDelivered: () => void;
}) {
  const intake = bundle.intake;
  const isReadyForCuration =
    bundle.order.status === "intake_received" &&
    Boolean(bundle.order.paypalCaptureId) &&
    Boolean(bundle.order.paidAt) &&
    Boolean(intake?.consentAccepted);
  const isReadyForDelivery = bundle.order.status === "in_curation";

  return (
    <section aria-labelledby="founder-edition-fulfillment-title">
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Founder Edition fulfillment">
          <h3
            id="founder-edition-fulfillment-title"
            className="font-serif text-2xl"
            style={{ color: C.text }}
          >
            Manual founder workflow
          </h3>
          <p className="mt-3 text-sm leading-6" style={{ color: C.muted }}>
            The 48-page edition is authored personally and emailed to the
            receiver within 5 calendar days after confirmed payment.
          </p>

          <dl className="mt-6 grid gap-4 text-sm">
            <AdminDatum label="Payment provider" value="PayPal" />
            <AdminDatum
              label="PayPal order"
              value={bundle.order.paypalOrderId ?? "Not created"}
            />
            <AdminDatum
              label="PayPal capture"
              value={bundle.order.paypalCaptureId ?? "Not confirmed"}
            />
            <AdminDatum
              label="Paid at"
              value={formatAdminDate(bundle.order.paidAt, true)}
            />
            <AdminDatum
              label="Delivery due"
              value={formatAdminDate(bundle.order.deliveryDueAt)}
            />
          </dl>
        </Panel>

        <Panel title="Receiver record">
          {intake ? (
            <div className="space-y-6">
              <div>
                <div className="font-serif text-xl" style={{ color: C.text }}>
                  {intake.name}
                </div>
                <div className="mt-1 text-sm" style={{ color: C.muted }}>
                  {intake.email}
                </div>
              </div>

              <div>
                <div
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: C.gold }}
                >
                  Birth details
                </div>
                <p
                  className="mt-2 text-sm leading-6"
                  style={{ color: C.muted }}
                >
                  {intake.birthDate} · {intake.birthTime}
                  <br />
                  {intake.birthPlace}, {intake.birthCountry}
                  <br />
                  {intake.timezone}
                </p>
              </div>

              <AdminQuestion
                label="Question one"
                value={intake.questionOne ?? intake.focusQuestion}
              />
              <AdminQuestion
                label="Question two"
                value={intake.questionTwo ?? "Not provided"}
              />
              <AdminDatum
                label="Consent"
                value={
                  intake.consentAccepted
                    ? `Accepted · ${formatAdminDate(
                        intake.consentAcceptedAt,
                        true
                      )}`
                    : "Not accepted"
                }
              />
            </div>
          ) : (
            <p className="text-sm" style={{ color: C.muted }}>
              Receiver details have not been saved.
            </p>
          )}
        </Panel>
      </div>

      <section
        className="mt-5 border p-5"
        style={{ borderColor: C.border, background: "rgba(216,181,109,0.025)" }}
        aria-label="Founder Edition workflow actions"
      >
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <div
              className="text-[10px] uppercase tracking-[0.22em]"
              style={{ color: C.gold }}
            >
              Current checkpoint
            </div>
            <p className="mt-2 text-sm" style={{ color: C.muted }}>
              {bundle.order.status}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Action
              onClick={onStartCuration}
              disabled={!isReadyForCuration || startPending}
            >
              Start curation
            </Action>
            <Action
              onClick={onMarkDelivered}
              disabled={!isReadyForDelivery || deliveryPending}
            >
              <MailCheck size={14} /> Mark delivered
            </Action>
          </div>
        </div>
      </section>
    </section>
  );
}

function AdminDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt
        className="text-[10px] uppercase tracking-[0.18em]"
        style={{ color: C.gold }}
      >
        {label}
      </dt>
      <dd
        className="m-0 break-all font-mono text-xs leading-5"
        style={{ color: C.text }}
      >
        {value}
      </dd>
    </div>
  );
}

function AdminQuestion({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="text-[10px] uppercase tracking-[0.2em]"
        style={{ color: C.gold }}
      >
        {label}
      </div>
      <p className="mt-2 text-sm leading-6" style={{ color: C.muted }}>
        {value}
      </p>
    </div>
  );
}

function formatAdminDate(value: DateValue | null, includeTime = false) {
  if (!value) return "Not confirmed";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit" as const,
          minute: "2-digit" as const,
          timeZoneName: "short" as const,
        }
      : {}),
  }).format(date);
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 border p-5" style={{ borderColor: C.border }}>
      <h3
        className="mb-4 text-xs uppercase tracking-[0.2em]"
        style={{ color: C.gold }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function Action({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 border px-4 py-2 text-xs uppercase tracking-[0.16em] disabled:opacity-40"
      style={{ borderColor: C.border, color: C.gold }}
    >
      {children}
    </button>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.readAsDataURL(file);
  });
}

function mutationError(mutations: Array<{ error: unknown }>) {
  const error = mutations.find(mutation => mutation.error)?.error;
  if (!error) return "";
  return error instanceof Error ? error.message : "Action failed.";
}

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { TetradicFounderOrderStatus } from "../client/src/features/tetradic-signature/TetradicFounderOrderStatus";

const ROOT = process.cwd();
const STATUS_COMPONENT =
  "client/src/features/tetradic-signature/TetradicFounderOrderStatus.tsx";
const STATUS_CSS =
  "client/src/features/tetradic-signature/tetradic-founder-order.css";
const ORDER_PAGE = "client/src/pages/TetradicFounderEditionOrder.tsx";
const PRODUCT_PAGE = "client/src/pages/TetradicSignatureSacredExperience.tsx";
const APP = "client/src/App.tsx";
const ROUTER = "server/routers.ts";

const runtimeGlobal = globalThis as typeof globalThis & {
  React?: typeof React;
};
const previousGlobalReact = runtimeGlobal.React;

beforeAll(() => {
  runtimeGlobal.React = React;
});

afterAll(() => {
  if (previousGlobalReact) {
    runtimeGlobal.React = previousGlobalReact;
    return;
  }
  delete runtimeGlobal.React;
});

function source(path: string) {
  return readFileSync(resolve(ROOT, path), "utf8");
}

describe("Tetradic Founder Edition checkout pages", () => {
  it("renders a confirmed manual-delivery state with the exact commercial contract", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TetradicFounderOrderStatus, {
        orderId: 91,
        phase: "confirmed",
        orderStatus: "intake_received",
        deliveryDueAt: new Date("2026-07-31T08:30:00.000Z"),
      })
    );

    expect(markup).toContain("Payment confirmed");
    expect(markup).toContain("48-page edition");
    expect(markup).toContain("Personally by email");
    expect(markup).toContain("31 July 2026");
    expect(markup).toContain("€81,32");
    expect(markup).toContain("PayPal verified");
    expect(markup).not.toMatch(/generate pdf/i);
    expect(markup).not.toMatch(/download/i);
  });

  it("keeps a cancelled checkpoint recoverable without collecting intake again", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TetradicFounderOrderStatus, {
        orderId: 91,
        phase: "cancelled",
        orderStatus: "pending_payment",
        actionLabel: "Return to PayPal · €81,32",
        onAction: () => undefined,
      })
    );

    expect(markup).toContain("Your details remain saved.");
    expect(markup).toContain("No confirmed payment was recorded.");
    expect(markup).toContain("Return to PayPal");
    expect(markup).not.toContain("<form");
  });

  it("wires login, checkpoint, server-created PayPal approval, and server capture", () => {
    const productPage = source(PRODUCT_PAGE);
    const orderPage = source(ORDER_PAGE);
    const router = source(ROUTER);
    const app = source(APP);

    expect(productPage).toContain("useAuth()");
    expect(productPage).toContain(
      "createFounderEditionCheckpoint.useMutation()"
    );
    expect(productPage).toContain(
      "createFounderEditionPayPalOrder.useMutation()"
    );
    expect(productPage).toContain(
      'getLoginUrl("/tetradic-signature#tetradic-founder-intake")'
    );
    expect(productPage).toContain("if (!values.consentAccepted)");
    expect(productPage).toContain("consent: true");

    expect(orderPage).toContain("redirectOnUnauthenticated: true");
    expect(orderPage).toContain("captureFounderEditionPayPalOrder.useMutation");
    expect(orderPage).toContain("capturePayment.mutate({ orderId })");
    expect(orderPage).not.toContain("paypalOrderId:");
    expect(orderPage).not.toContain("token:");

    expect(router).toContain("createFounderEditionPayPalOrder:");
    expect(router).toContain("captureFounderEditionPayPalOrder:");
    expect(router).not.toContain("attachFounderEditionPayPalOrder:");
    expect(app).toContain('path={"/signature-order/:orderId"}');
  });

  it("keeps the payment status styling local and reduced-motion safe", () => {
    const component = source(STATUS_COMPONENT);
    const css = source(STATUS_CSS);
    const selectorOpeners = css
      .split("\n")
      .map(line => line.trim())
      .filter(
        line =>
          line.endsWith("{") &&
          !line.startsWith("@") &&
          line !== "from {" &&
          line !== "to {" &&
          !/^\d+%\s*\{$/.test(line)
      );

    expect(
      selectorOpeners.filter(line => !line.includes(".tfe-order"))
    ).toEqual([]);
    expect(css).toContain("--tfe-order-void: #030303");
    expect(css).toContain("--tfe-order-gold: #d8b56d");
    expect(css).toContain("--tfe-order-ivory: #fff7e6");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(component).not.toMatch(/generate pdf/i);
    expect(component).not.toMatch(/\bdownload\b/i);
  });
});

import type { Express } from "express";
import { ENV } from "./_core/env";
import { CARRIER_LINE, signalSerial } from "../shared/daily-signal";
import { getTodaysSignal, type DailySignalRow } from "./daily-signal-service";

/**
 * A plain feed of today's signal for anything that posts it elsewhere —
 * the community's bot fetches this once a day and posts `post` verbatim.
 *
 * The post is a teaser: the signal's body stays sealed on the site, so
 * the carrierlock is still the only way in.
 */

const FALLBACK_BASE_URL = "https://orielsignal.space";

export function formatDailySignalPost(row: DailySignalRow, baseUrl: string) {
  const link = `${baseUrl.replace(/\/+$/, "")}/archive?dfs=${signalSerial(row.txGenId)}`;
  const post = [
    `⦿ ${row.txGenId} · ${row.title.replace(/\s+/g, " ").trim()}`,
    `Signal Clarity ${row.clarity}% · ${row.channelStatus}`,
    "",
    CARRIER_LINE,
    "",
    `→ ${link}`,
  ].join("\n");

  return {
    id: row.txGenId,
    date: row.signalDate,
    title: row.title,
    clarity: row.clarity,
    register: row.clarityRegister,
    status: row.channelStatus,
    link,
    post,
  };
}

export function registerDailySignalFeedRoute(app: Express) {
  app.get("/api/daily-signal/today", async (_req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      const row = await getTodaysSignal();
      if (!row) {
        // Generation runs within minutes of 00:00 UTC; a caller that
        // arrives first should simply try again later.
        res.status(404).json({ error: "today's signal is not generated yet" });
        return;
      }
      res.json(formatDailySignalPost(row, ENV.appBaseUrl || FALLBACK_BASE_URL));
    } catch (error) {
      console.error("[daily-signal] feed failed:", error);
      res.status(500).json({ error: "feed unavailable" });
    }
  });
}

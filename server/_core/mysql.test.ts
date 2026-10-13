import { describe, expect, it } from "vitest";
import { buildMysqlPoolConfig } from "./mysql";

describe("database pool", () => {
  it("keeps connections alive and gives up fast instead of hanging on a dead one", () => {
    const config = buildMysqlPoolConfig("mysql://u:p@db.example.com:4000/oriel");
    expect(config.enableKeepAlive).toBe(true);
    expect(config.connectTimeout).toBeLessThanOrEqual(10_000);
    expect(config.idleTimeout).toBeLessThanOrEqual(60_000);
  });
});

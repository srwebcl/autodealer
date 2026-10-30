import { describe, expect, it } from "vitest";
import { getDatabaseEnv } from "@/lib/env";

describe("getDatabaseEnv", () => {
  it("acepta una URL postgres", () => {
    expect(getDatabaseEnv({ DATABASE_URL: "postgresql://u:p@h/db" }).DATABASE_URL).toBe("postgresql://u:p@h/db");
  });
  it("falla sin revelar valores", () => {
    const secret = "mysql://user:SUPERSECRETO@host/db";
    expect(() => getDatabaseEnv({ DATABASE_URL: secret })).toThrow(/DATABASE_URL/);
    try {
      getDatabaseEnv({ DATABASE_URL: secret });
    } catch (e) {
      expect(String(e)).not.toContain("SUPERSECRETO");
    }
  });
  it("falla si falta", () => {
    expect(() => getDatabaseEnv({})).toThrow(/DATABASE_URL/);
  });
});

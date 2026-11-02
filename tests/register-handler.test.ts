import assert from "node:assert/strict";
import test from "node:test";
import { registerBusiness, type RegistrationEnv } from "../lib/register-handler";

type FakeResult = { success: boolean };

class FakeStatement {
  params: unknown[] = [];
  constructor(readonly sql: string) {}
  bind(...params: unknown[]) {
    this.params = params;
    return this;
  }
  async first<T>(): Promise<T | null> {
    return null;
  }
}

class FakeDatabase {
  lastBatch: FakeStatement[] = [];
  failedStatementIndex: number | null = null;
  prepare(sql: string) {
    return new FakeStatement(sql);
  }
  async batch(statements: FakeStatement[]): Promise<FakeResult[]> {
    this.lastBatch = statements;
    return statements.map((_, index) => ({ success: index !== this.failedStatementIndex }));
  }
}

function fixture(failedStatementIndex: number | null = null) {
  const db = new FakeDatabase();
  db.failedStatementIndex = failedStatementIndex;
  let kvPutCalls = 0;
  const env = {
    DB: db as unknown as D1Database,
    KV_BINDING: { get: async () => null, put: async () => { kvPutCalls += 1; } } as unknown as KVNamespace,
    SESSION_SECRET: "registration-handler-test-secret-long-enough",
  } satisfies RegistrationEnv;
  const request = new Request("https://qutoof.example/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessName: "متجر اختباري",
      vertical: "retail",
      fullName: "مستخدم تجريبي",
      phone: "01029505502",
      email: `synthetic-${crypto.randomUUID()}@example.invalid`,
      password: "StrongPassword123",
    }),
  });
  return { db, env, request, getKvPutCalls: () => kvPutCalls };
}

const insertedTables = (db: FakeDatabase) => db.lastBatch.map((statement) => statement.sql.match(/INSERT INTO ([a-z_]+)/)?.[1]);

test("registration writes the first active branch and owner membership before issuing a session", async () => {
  const { db, env, request, getKvPutCalls } = fixture();
  const response = await registerBusiness(request, env);
  const body = await response.json() as { user: { id: string; role: string; phone: string }; tenant: { id: string; status: string; accountStatus: string; contactPhone: string; trialDays: number }; initialBranchId: string };

  assert.equal(response.status, 201);
  assert.match(response.headers.get("Set-Cookie") ?? "", /qutoof_session=/);
  assert.deepEqual(insertedTables(db), ["tenants", "users", "branches", "branch_memberships", "audit_logs"]);
  assert.equal(db.lastBatch[2]?.params[0], body.initialBranchId);
  assert.equal(db.lastBatch[2]?.params[1], body.tenant.id);
  assert.equal(db.lastBatch[3]?.params[1], body.tenant.id);
  assert.equal(db.lastBatch[3]?.params[2], body.user.id);
  assert.equal(db.lastBatch[3]?.params[3], body.initialBranchId);
  assert.equal(db.lastBatch[0]?.params[4], "+201029505502");
  assert.equal(db.lastBatch[1]?.params[5], "+201029505502");
  assert.equal(body.user.phone, "+201029505502");
  assert.equal(body.tenant.contactPhone, "+201029505502");
  assert.equal(body.tenant.accountStatus, "active");
  assert.equal(body.user.role, "business_admin");
  assert.equal(body.tenant.status, "active_trial");
  assert.equal(body.tenant.trialDays, 30);
  assert.equal(getKvPutCalls(), 2);
});

test("registration failure in the branch membership batch returns no session", async () => {
  const { db, env, request, getKvPutCalls } = fixture(3);
  const response = await registerBusiness(request, env);

  assert.equal(response.status, 409);
  assert.equal(response.headers.get("Set-Cookie"), null);
  assert.equal(getKvPutCalls(), 0);
  assert.deepEqual(insertedTables(db), ["tenants", "users", "branches", "branch_memberships", "audit_logs"]);
});

test("registration rejects a missing or malformed mandatory mobile before creating records", async () => {
  const { db, env, getKvPutCalls } = fixture();
  const request = new Request("https://qutoof.example/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessName: "متجر اختباري", vertical: "retail", fullName: "مستخدم تجريبي", email: "phone-test@example.invalid", password: "StrongPassword123", phone: "12-ab" }),
  });
  const response = await registerBusiness(request, env);
  assert.equal(response.status, 400);
  assert.deepEqual(db.lastBatch, []);
  assert.equal(getKvPutCalls(), 0);
});

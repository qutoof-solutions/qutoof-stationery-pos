import { serverMessage } from "@/lib/i18n/p1-server-messages";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth";
import type { getRuntimeEnv } from "@/lib/db/client";
import { authAttemptKeys, clearAuthFailures, isAuthRateLimited, recordAuthFailure } from "@/lib/server/auth-rate-limit";
import { resolveSessionFromCookieHeader } from "@/lib/server/session";
import { createRecoveryCodeRecords } from "@/lib/server/recovery";
import { isAccountSuspended } from "@/lib/account-access";
import { suspendedAccountResponse } from "@/lib/server/account-access";

export const runtime = "edge";

const inputSchema = z.object({ currentPassword: z.string().min(1).max(128) }).strict();

type RecoveryEnv = ReturnType<typeof getRuntimeEnv>;

export async function POST(request: Request): Promise<Response> {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure(serverMessage(request, "p1Server.recoveryCodes.invalidInput"), 400);

  const env = getRequestContext().env as RecoveryEnv;
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) return failure(serverMessage(request, "p1Server.recoveryCodes.unconfigured"), 503);
  const session = await resolveSessionFromCookieHeader(request.headers.get("cookie") ?? "", env as Parameters<typeof resolveSessionFromCookieHeader>[1]);
  if (!session || !session.tenantId) return failure(serverMessage(request, "errors.sessionExpired"), 401);

  const user = await env.DB.prepare("SELECT u.id, u.tenant_id, u.email, u.password_hash, u.role, t.account_status FROM users u JOIN tenants t ON t.id = u.tenant_id WHERE u.id = ? AND u.tenant_id = ? AND u.is_active = 1 LIMIT 1")
    .bind(session.sub, session.tenantId)
    .first<{ id: string; tenant_id: string; email: string; password_hash: string; role: string; account_status: string }>();
  if (!user || user.role !== session.role) return failure(serverMessage(request, "errors.sessionExpired"), 401);
  if (isAccountSuspended(user.account_status)) return suspendedAccountResponse(request);

  const keys = await authAttemptKeys(user.email, request, env.SESSION_SECRET);
  if (await isAuthRateLimited(env.DB, keys)) return failure(serverMessage(request, "p1Server.recoveryCodes.attemptsExceeded"), 429, { "Retry-After": "900" });
  if (!(await verifyPassword(parsed.data.currentPassword, user.password_hash))) {
    await recordAuthFailure(env.DB, keys);
    return failure(serverMessage(request, "p1Server.recoveryCodes.currentPasswordInvalid"), 401);
  }

  try {
    const records = await createRecoveryCodeRecords();
    const now = Math.floor(Date.now() / 1000);
    const statements = [
      env.DB.prepare("DELETE FROM auth_recovery_codes WHERE user_id = ?").bind(user.id),
      ...records.map((record) => env.DB.prepare("INSERT INTO auth_recovery_codes (id, user_id, code_hash, created_at, used_at, consumption_id) VALUES (?, ?, ?, ?, NULL, NULL)").bind(crypto.randomUUID(), user.id, record.codeHash, now)),
      env.DB.prepare("INSERT INTO audit_logs (id, tenant_id, actor_id, action, resource_type, resource_id, ip_address, user_agent, metadata_json, created_at) VALUES (?, ?, ?, 'auth.recovery_codes_issued', 'user', ?, NULL, ?, ?, ?)").bind(crypto.randomUUID(), user.tenant_id, user.id, user.id, request.headers.get("user-agent")?.slice(0, 300) ?? null, JSON.stringify({ method: "password_reauthentication", count: records.length }), now),
    ];
    await env.DB.batch(statements);
    await clearAuthFailures(env.DB, keys);
    return Response.json({ recoveryCodes: records.map((record) => record.plainCode) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return failure(serverMessage(request, "p1Server.recoveryCodes.issueFailed"), 500);
  }
}

function failure(error: string, status: number, extraHeaders: Record<string, string> = {}): Response {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store", ...extraHeaders } });
}

import { and, asc, eq, gte, lt } from "drizzle-orm";
import { z } from "zod";
import { hrAttendance, hrCustody, hrEmployees, hrPayroll, hrTransactions, users } from "@/lib/db/schema";
import { requireOperationAccess, writeAudit } from "@/lib/server/operations";
import { calculatePayroll, getPayrollPeriod } from "@/lib/hr/payroll";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable().optional();
const idSchema = z.string().trim().min(1).max(128);
const moneySchema = z.number().int().min(0).max(2_000_000_000);
const employeeCreate = z.object({ action: z.literal("employee.create"), name: z.string().trim().min(2).max(120), role: z.string().trim().min(2).max(80), basicSalaryMinor: moneySchema, joinDate: dateSchema, userId: idSchema.nullable().optional(), notes: z.string().trim().max(1000).nullable().optional() });
const employeeUpdate = z.object({ action: z.literal("employee.update"), id: idSchema, name: z.string().trim().min(2).max(120).optional(), role: z.string().trim().min(2).max(80).optional(), basicSalaryMinor: moneySchema.optional(), joinDate: dateSchema.optional(), status: z.enum(["active", "inactive"]).optional(), notes: z.string().trim().max(1000).nullable().optional() });
const attendanceSave = z.object({ action: z.literal("attendance.save"), employeeId: idSchema, date: dateSchema, checkIn: timeSchema, checkOut: timeSchema, status: z.enum(["present", "absent", "leave", "late"]) });
const transactionCreate = z.object({ action: z.literal("transaction.create"), employeeId: idSchema, type: z.enum(["advance_loan", "bonus", "penalty", "deduction"]), amountMinor: z.number().int().positive().max(2_000_000_000), date: dateSchema, reason: z.string().trim().min(2).max(500) });
const custodyCreate = z.object({ action: z.literal("custody.create"), employeeId: idSchema, itemName: z.string().trim().min(2).max(160), givenDate: dateSchema });
const custodyReturn = z.object({ action: z.literal("custody.return"), id: idSchema, returnDate: dateSchema });
const payrollGenerate = z.object({ action: z.literal("payroll.generate"), month: z.number().int().min(1).max(12), year: z.number().int().min(2000).max(9999) });
const payrollMarkPaid = z.object({ action: z.literal("payroll.markPaid"), id: idSchema });
const inputSchema = z.discriminatedUnion("action", [employeeCreate, employeeUpdate, attendanceSave, transactionCreate, custodyCreate, custodyReturn, payrollGenerate, payrollMarkPaid]);

function failure(code: string, status: number): Response {
  return Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });
}

async function employeeInTenant(context: { db: ReturnType<typeof import("@/lib/db/client").getDb>; tenantId: string }, employeeId: string) {
  const [employee] = await context.db.select({ id: hrEmployees.id, status: hrEmployees.status }).from(hrEmployees).where(and(eq(hrEmployees.id, employeeId), eq(hrEmployees.tenantId, context.tenantId))).limit(1);
  return employee;
}

export async function GET(request: Request): Promise<Response> {
  const access = await requireOperationAccess(request, ["business_admin"]);
  if (!access.ok) return access.response;
  const { db, tenantId } = access.context;
  try {
    const [employees, attendance, transactions, custody, payroll, linkedUsers] = await Promise.all([
      db.select().from(hrEmployees).where(eq(hrEmployees.tenantId, tenantId)).orderBy(asc(hrEmployees.name)).limit(500),
      db.select().from(hrAttendance).where(eq(hrAttendance.tenantId, tenantId)).orderBy(asc(hrAttendance.date)).limit(1000),
      db.select().from(hrTransactions).where(eq(hrTransactions.tenantId, tenantId)).orderBy(asc(hrTransactions.date)).limit(1000),
      db.select().from(hrCustody).where(eq(hrCustody.tenantId, tenantId)).orderBy(asc(hrCustody.givenDate)).limit(500),
      db.select().from(hrPayroll).where(eq(hrPayroll.tenantId, tenantId)).orderBy(asc(hrPayroll.year), asc(hrPayroll.month)).limit(1000),
      db.select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role }).from(users).where(and(eq(users.tenantId, tenantId), eq(users.isActive, true))).orderBy(asc(users.fullName)).limit(500),
    ]);
    return Response.json({ employees, attendance, transactions, custody, payroll, linkedUsers }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return failure("hr_storage_unavailable", 503);
  }
}

export async function POST(request: Request): Promise<Response> {
  const access = await requireOperationAccess(request, ["business_admin"]);
  if (!access.ok) return access.response;
  const { db, tenantId } = access.context;
  let body: unknown;
  try { body = await request.json(); } catch { return failure("invalid_json", 400); }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return failure("invalid_input", 400);
  const input = parsed.data;
  const now = new Date();
  try {
    switch (input.action) {
      case "employee.create": {
        if (input.userId) {
          const [linkedUser] = await db.select({ id: users.id }).from(users).where(and(eq(users.id, input.userId), eq(users.tenantId, tenantId), eq(users.isActive, true))).limit(1);
          if (!linkedUser) return failure("hr_user_link_invalid", 400);
        }
        const id = crypto.randomUUID();
        await db.insert(hrEmployees).values({ id, tenantId, userId: input.userId ?? null, name: input.name, role: input.role, basicSalaryMinor: input.basicSalaryMinor, joinDate: input.joinDate, status: "active", notes: input.notes ?? null, createdAt: now, updatedAt: now }).run();
        await writeAudit(access.context, request, "hr.employee.created", "hr_employee", id);
        return Response.json({ id }, { status: 201 });
      }
      case "employee.update": {
        const [current] = await db.select({ id: hrEmployees.id }).from(hrEmployees).where(and(eq(hrEmployees.id, input.id), eq(hrEmployees.tenantId, tenantId))).limit(1);
        if (!current) return failure("hr_employee_not_found", 404);
        const patch = {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.role !== undefined ? { role: input.role } : {}),
          ...(input.basicSalaryMinor !== undefined ? { basicSalaryMinor: input.basicSalaryMinor } : {}),
          ...(input.joinDate !== undefined ? { joinDate: input.joinDate } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          updatedAt: now,
        };
        await db.update(hrEmployees).set(patch).where(and(eq(hrEmployees.id, input.id), eq(hrEmployees.tenantId, tenantId))).run();
        await writeAudit(access.context, request, "hr.employee.updated", "hr_employee", input.id);
        return Response.json({ ok: true });
      }
      case "attendance.save": {
        const employee = await employeeInTenant(access.context, input.employeeId);
        if (!employee || employee.status !== "active") return failure("hr_employee_not_found", 404);
        if (input.checkIn && input.checkOut && input.checkOut < input.checkIn) return failure("invalid_time_range", 400);
        const [existing] = await db.select({ id: hrAttendance.id }).from(hrAttendance).where(and(eq(hrAttendance.tenantId, tenantId), eq(hrAttendance.employeeId, input.employeeId), eq(hrAttendance.date, input.date))).limit(1);
        if (existing) {
          await db.update(hrAttendance).set({ checkIn: input.checkIn ?? null, checkOut: input.checkOut ?? null, status: input.status, updatedAt: now }).where(and(eq(hrAttendance.id, existing.id), eq(hrAttendance.tenantId, tenantId))).run();
        } else {
          await db.insert(hrAttendance).values({ id: crypto.randomUUID(), tenantId, employeeId: input.employeeId, date: input.date, checkIn: input.checkIn ?? null, checkOut: input.checkOut ?? null, status: input.status, createdAt: now, updatedAt: now }).run();
        }
        await writeAudit(access.context, request, "hr.attendance.saved", "hr_attendance", existing?.id ?? null);
        return Response.json({ ok: true });
      }
      case "transaction.create": {
        const employee = await employeeInTenant(access.context, input.employeeId);
        if (!employee || employee.status !== "active") return failure("hr_employee_not_found", 404);
        const id = crypto.randomUUID();
        await db.insert(hrTransactions).values({ id, tenantId, employeeId: input.employeeId, type: input.type, amountMinor: input.amountMinor, date: input.date, reason: input.reason, createdAt: now, updatedAt: now }).run();
        await writeAudit(access.context, request, "hr.transaction.created", "hr_transaction", id);
        return Response.json({ id }, { status: 201 });
      }
      case "custody.create": {
        const employee = await employeeInTenant(access.context, input.employeeId);
        if (!employee || employee.status !== "active") return failure("hr_employee_not_found", 404);
        const id = crypto.randomUUID();
        await db.insert(hrCustody).values({ id, tenantId, employeeId: input.employeeId, itemName: input.itemName, givenDate: input.givenDate, returnDate: null, status: "assigned", createdAt: now, updatedAt: now }).run();
        await writeAudit(access.context, request, "hr.custody.created", "hr_custody", id);
        return Response.json({ id }, { status: 201 });
      }
      case "custody.return": {
        const [item] = await db.select({ id: hrCustody.id }).from(hrCustody).where(and(eq(hrCustody.id, input.id), eq(hrCustody.tenantId, tenantId))).limit(1);
        if (!item) return failure("hr_custody_not_found", 404);
        await db.update(hrCustody).set({ returnDate: input.returnDate, status: "returned", updatedAt: now }).where(and(eq(hrCustody.id, input.id), eq(hrCustody.tenantId, tenantId))).run();
        await writeAudit(access.context, request, "hr.custody.returned", "hr_custody", input.id);
        return Response.json({ ok: true });
      }
      case "payroll.generate": {
        const { startDate, endDateExclusive } = getPayrollPeriod(input.year, input.month);
        const [employees, transactions] = await Promise.all([
          db.select().from(hrEmployees).where(and(eq(hrEmployees.tenantId, tenantId), eq(hrEmployees.status, "active"))).orderBy(asc(hrEmployees.name)),
          db.select().from(hrTransactions).where(and(eq(hrTransactions.tenantId, tenantId), gte(hrTransactions.date, startDate), lt(hrTransactions.date, endDateExclusive))),
        ]);
        const byEmployee = new Map<string, typeof transactions>();
        for (const transaction of transactions) {
          const list = byEmployee.get(transaction.employeeId) ?? [];
          list.push(transaction);
          byEmployee.set(transaction.employeeId, list);
        }
        for (const employee of employees) {
          const totals = calculatePayroll(employee.basicSalaryMinor, byEmployee.get(employee.id) ?? []);
          const payrollId = crypto.randomUUID();
          await db.insert(hrPayroll).values({ id: payrollId, tenantId, employeeId: employee.id, month: input.month, year: input.year, ...totals, status: "pending", createdAt: now, updatedAt: now }).onConflictDoNothing().run();
        }
        const records = await db.select().from(hrPayroll).where(and(eq(hrPayroll.tenantId, tenantId), eq(hrPayroll.month, input.month), eq(hrPayroll.year, input.year))).orderBy(asc(hrPayroll.employeeId));
        await writeAudit(access.context, request, "hr.payroll.generated", "hr_payroll_period", `${input.year}-${String(input.month).padStart(2, "0")}`, { count: records.length });
        return Response.json({ payroll: records });
      }
      case "payroll.markPaid": {
        const [record] = await db.select({ id: hrPayroll.id, status: hrPayroll.status }).from(hrPayroll).where(and(eq(hrPayroll.id, input.id), eq(hrPayroll.tenantId, tenantId))).limit(1);
        if (!record) return failure("hr_payroll_not_found", 404);
        await db.update(hrPayroll).set({ status: "paid", updatedAt: now }).where(and(eq(hrPayroll.id, input.id), eq(hrPayroll.tenantId, tenantId), eq(hrPayroll.status, "pending"))).run();
        await writeAudit(access.context, request, "hr.payroll.marked_paid", "hr_payroll", input.id);
        return Response.json({ ok: true });
      }
    }
  } catch {
    return failure("hr_operation_failed", 500);
  }
}

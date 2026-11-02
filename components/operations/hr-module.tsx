"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { apiRequest, EmptyState, formatMoney, ModuleTitle, Notice, useLoad } from "@/components/operations/shared";

type Employee = { id: string; userId: string | null; name: string; role: string; basicSalaryMinor: number; joinDate: string; status: "active" | "inactive"; notes: string | null };
type Attendance = { id: string; employeeId: string; date: string; checkIn: string | null; checkOut: string | null; status: "present" | "absent" | "leave" | "late" };
type Transaction = { id: string; employeeId: string; type: "advance_loan" | "bonus" | "penalty" | "deduction"; amountMinor: number; date: string; reason: string };
type Custody = { id: string; employeeId: string; itemName: string; givenDate: string; returnDate: string | null; status: "assigned" | "returned" };
type Payroll = { id: string; employeeId: string; month: number; year: number; basicSalaryMinor: number; totalBonusesMinor: number; totalDeductionsMinor: number; netSalaryMinor: number; status: "paid" | "pending" };
type LinkedUser = { id: string; fullName: string; email: string; role: string };
type HrData = { employees: Employee[]; attendance: Attendance[]; transactions: Transaction[]; custody: Custody[]; payroll: Payroll[]; linkedUsers: LinkedUser[] };
type Tab = "employees" | "attendance" | "financials" | "custody" | "payroll";

const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-teal focus:ring-2 focus:ring-teal/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export function HrModule() {
  const t = useTranslations("hr");
  const locale = useLocale();
  const loaded = useLoad<HrData>("/api/ops/hr");
  const [tab, setTab] = useState<Tab>("employees");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; kind: "error" | "success" } | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [period, setPeriod] = useState(() => { const now = new Date(); return { month: now.getMonth() + 1, year: now.getFullYear() }; });
  const data = loaded.data;
  const employees = data?.employees ?? [];
  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId) ?? null;
  const periodPayroll = useMemo(() => (data?.payroll ?? []).filter((row) => row.month === period.month && row.year === period.year), [data?.payroll, period]);

  async function submit(event: FormEvent<HTMLFormElement>, payload: Record<string, unknown>, successText: string) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true); setNotice(null);
    try {
      await apiRequest("/api/ops/hr", { method: "POST", body: JSON.stringify(payload) });
      setNotice({ text: successText, kind: "success" });
      await loaded.reload();
      form.reset();
    } catch {
      setNotice({ text: t("errors.operationFailed"), kind: "error" });
    } finally { setBusy(false); }
  }

  async function execute(payload: Record<string, unknown>, successText: string) {
    setBusy(true); setNotice(null);
    try {
      await apiRequest("/api/ops/hr", { method: "POST", body: JSON.stringify(payload) });
      setNotice({ text: successText, kind: "success" });
      await loaded.reload();
    } catch {
      setNotice({ text: t("errors.operationFailed"), kind: "error" });
    } finally { setBusy(false); }
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "employees", label: t("tabs.employees") }, { id: "attendance", label: t("tabs.attendance") },
    { id: "financials", label: t("tabs.financials") }, { id: "custody", label: t("tabs.custody") }, { id: "payroll", label: t("tabs.payroll") },
  ];

  if (loaded.loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">{t("loading")}</div>;
  if (loaded.error || !data) return <section><ModuleTitle eyebrow={t("eyebrow")} title={t("title")} description={t("description")} /><Notice>{t("errors.loadFailed")}</Notice></section>;

  return <section dir={locale === "ar" ? "rtl" : "ltr"}>
    <ModuleTitle eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
    {notice && <div className="mb-4"><Notice kind={notice.kind}>{notice.text}</Notice></div>}
    <nav aria-label={t("tabs.label")} className="mb-5 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">{tabs.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === item.id ? "bg-teal text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>{item.label}</button>)}</nav>

    {tab === "employees" && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,.7fr)]">
      <div className="space-y-4">
        <form onSubmit={(event) => { const form = new FormData(event.currentTarget); const salary = Number(form.get("salary")); void submit(event, { action: "employee.create", name: form.get("name"), role: form.get("role"), basicSalaryMinor: Math.round(salary * 100), joinDate: form.get("joinDate"), userId: form.get("userId") || null, notes: form.get("notes") || null }, t("messages.employeeCreated")); }} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2">
          <Field label={t("fields.name")} name="name" required />
          <Field label={t("fields.role")} name="role" required />
          <Field label={t("fields.basicSalary")} name="salary" type="number" min="0" step="0.01" required />
          <Field label={t("fields.joinDate")} name="joinDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("fields.linkedUser")}</span><select name="userId" defaultValue="" className={inputClass}><option value="">{t("fields.noLinkedUser")}</option>{data.linkedUsers.map((user) => <option key={user.id} value={user.id}>{user.fullName} · {user.email}</option>)}</select></label>
          <Field label={t("fields.notes")} name="notes" />
          <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{t("actions.addEmployee")}</Button></div>
        </form>
        {!employees.length ? <EmptyState title={t("empty.employeesTitle")} detail={t("empty.employeesDetail")} /> : <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><table className="min-w-full text-start text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800"><tr><th className="p-3">{t("fields.name")}</th><th className="p-3">{t("fields.role")}</th><th className="p-3">{t("fields.basicSalary")}</th><th className="p-3">{t("fields.status")}</th><th className="p-3">{t("fields.profile")}</th></tr></thead><tbody>{employees.map((employee) => <tr key={employee.id} className="border-t border-slate-100 dark:border-slate-800"><td className="p-3 font-semibold">{employee.name}</td><td className="p-3">{employee.role}</td><td className="p-3">{formatMoney(employee.basicSalaryMinor, locale)}</td><td className="p-3">{t(`status.employee.${employee.status}`)}</td><td className="p-3"><Button type="button" variant="outline" size="sm" onClick={() => setSelectedEmployeeId(employee.id)}>{t("actions.viewProfile")}</Button></td></tr>)}</tbody></table></div>}
      </div>
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><h2 className="text-lg font-bold text-navy dark:text-slate-100">{t("profile.title")}</h2>{selectedEmployee ? <div className="mt-4 space-y-3 text-sm"><p className="text-xl font-bold">{selectedEmployee.name}</p><p>{t("fields.role")}: {selectedEmployee.role}</p><p>{t("fields.joinDate")}: {selectedEmployee.joinDate}</p><p>{t("fields.status")}: {t(`status.employee.${selectedEmployee.status}`)}</p>{selectedEmployee.userId && <p>{t("fields.linkedUser")}: {data.linkedUsers.find((user) => user.id === selectedEmployee.userId)?.fullName ?? t("fields.linkedUserExists")}</p>}{selectedEmployee.notes && <p>{t("fields.notes")}: {selectedEmployee.notes}</p>}<form onSubmit={(event) => { const form = new FormData(event.currentTarget); const salary = Number(form.get("salary")); void submit(event, { action: "employee.update", id: selectedEmployee.id, basicSalaryMinor: Math.round(salary * 100) }, t("messages.salaryUpdated")); }} className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800"><Field label={t("fields.basicSalary")} name="salary" type="number" min="0" step="0.01" required defaultValue={(selectedEmployee.basicSalaryMinor / 100).toFixed(2)} /><Button type="submit" disabled={busy}>{t("actions.saveSalary")}</Button></form></div> : <p className="mt-3 text-sm text-slate-500">{t("profile.selectPrompt")}</p>}</aside>
    </div>}

    {tab === "attendance" && <div className="space-y-4"><form onSubmit={(event) => { const form = new FormData(event.currentTarget); void submit(event, { action: "attendance.save", employeeId: form.get("employeeId"), date: form.get("date"), checkIn: form.get("checkIn") || null, checkOut: form.get("checkOut") || null, status: form.get("status") }, t("messages.attendanceSaved")); }} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-3"><EmployeeSelect label={t("fields.employee")} employees={activeEmployees} /><Field label={t("fields.date")} name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /><StatusSelect label={t("fields.attendanceStatus")} name="status" values={["present", "absent", "leave", "late"]} translate={t} group="attendance" /><Field label={t("fields.checkIn")} name="checkIn" type="time" /><Field label={t("fields.checkOut")} name="checkOut" type="time" /><div className="flex items-end"><Button type="submit" disabled={busy || !activeEmployees.length}>{t("actions.saveAttendance")}</Button></div></form>
      <RecordTable title={t("sections.attendanceHistory")} empty={t("empty.attendance")} headers={[t("fields.employee"), t("fields.date"), t("fields.checkIn"), t("fields.checkOut"), t("fields.attendanceStatus")]} rows={[...data.attendance].reverse().map((row) => [employeeName(employees, row.employeeId), row.date, row.checkIn ?? "—", row.checkOut ?? "—", t(`status.attendance.${row.status}`)])} />
    </div>}

    {tab === "financials" && <div className="space-y-4"><form onSubmit={(event) => { const form = new FormData(event.currentTarget); void submit(event, { action: "transaction.create", employeeId: form.get("employeeId"), type: form.get("type"), amountMinor: Math.round(Number(form.get("amount")) * 100), date: form.get("date"), reason: form.get("reason") }, t("messages.transactionCreated")); }} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-3"><EmployeeSelect label={t("fields.employee")} employees={activeEmployees} /><StatusSelect label={t("fields.transactionType")} name="type" values={["advance_loan", "bonus", "penalty", "deduction"]} translate={t} group="transaction" /><Field label={t("fields.amount")} name="amount" type="number" min="0.01" step="0.01" required /><Field label={t("fields.date")} name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /><Field label={t("fields.reason")} name="reason" required /><div className="flex items-end"><Button type="submit" disabled={busy || !activeEmployees.length}>{t("actions.addTransaction")}</Button></div></form>
      <RecordTable title={t("sections.transactionHistory")} empty={t("empty.transactions")} headers={[t("fields.employee"), t("fields.date"), t("fields.transactionType"), t("fields.amount"), t("fields.reason")]} rows={[...data.transactions].reverse().map((row) => [employeeName(employees, row.employeeId), row.date, t(`status.transaction.${row.type}`), formatMoney(row.amountMinor, locale), row.reason])} />
    </div>}

    {tab === "custody" && <div className="space-y-4"><form onSubmit={(event) => { const form = new FormData(event.currentTarget); void submit(event, { action: "custody.create", employeeId: form.get("employeeId"), itemName: form.get("itemName"), givenDate: form.get("givenDate") }, t("messages.custodyCreated")); }} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-3"><EmployeeSelect label={t("fields.employee")} employees={activeEmployees} /><Field label={t("fields.itemName")} name="itemName" required /><Field label={t("fields.givenDate")} name="givenDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /><div className="flex items-end"><Button type="submit" disabled={busy || !activeEmployees.length}>{t("actions.addCustody")}</Button></div></form>
      {!data.custody.length ? <EmptyState title={t("empty.custodyTitle")} detail={t("empty.custody")} /> : <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><table className="min-w-full text-start text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800"><tr>{[t("fields.employee"), t("fields.itemName"), t("fields.givenDate"), t("fields.returnDate"), t("fields.custodyStatus"), t("fields.action")].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>{data.custody.map((row) => <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800"><td className="p-3">{employeeName(employees, row.employeeId)}</td><td className="p-3">{row.itemName}</td><td className="p-3">{row.givenDate}</td><td className="p-3">{row.returnDate ?? "—"}</td><td className="p-3">{t(`status.custody.${row.status}`)}</td><td className="p-3">{row.status === "assigned" && <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void execute({ action: "custody.return", id: row.id, returnDate: new Date().toISOString().slice(0, 10) }, t("messages.custodyReturned"))}>{t("actions.markReturned")}</Button>}</td></tr>)}</tbody></table></div>}
    </div>}

    {tab === "payroll" && <div className="space-y-4"><div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><label className="block"><span className="mb-1.5 block text-sm font-medium">{t("fields.month")}</span><select value={period.month} onChange={(event) => setPeriod((current) => ({ ...current, month: Number(event.target.value) }))} className={inputClass}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{t(`months.${index + 1}`)}</option>)}</select></label><label className="block"><span className="mb-1.5 block text-sm font-medium">{t("fields.year")}</span><input type="number" min="2000" max="9999" value={period.year} onChange={(event) => setPeriod((current) => ({ ...current, year: Number(event.target.value) }))} className={inputClass} /></label><Button type="button" disabled={busy || !activeEmployees.length} onClick={() => void execute({ action: "payroll.generate", month: period.month, year: period.year }, t("messages.payrollGenerated"))}>{t("actions.generatePayroll")}</Button></div>
      {!periodPayroll.length ? <EmptyState title={t("empty.payrollTitle")} detail={t("empty.payroll")} /> : <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><table className="min-w-full text-start text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800"><tr>{[t("fields.employee"), t("fields.basicSalary"), t("fields.bonuses"), t("fields.deductions"), t("fields.netSalary"), t("fields.payrollStatus"), t("fields.action")].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>{periodPayroll.map((row) => <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800"><td className="p-3 font-semibold">{employeeName(employees, row.employeeId)}</td><td className="p-3">{formatMoney(row.basicSalaryMinor, locale)}</td><td className="p-3">{formatMoney(row.totalBonusesMinor, locale)}</td><td className="p-3">{formatMoney(row.totalDeductionsMinor, locale)}</td><td className="p-3 font-bold">{formatMoney(row.netSalaryMinor, locale)}</td><td className="p-3">{t(`status.payroll.${row.status}`)}</td><td className="p-3">{row.status === "pending" && <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void execute({ action: "payroll.markPaid", id: row.id }, t("messages.payrollPaid"))}>{t("actions.markPaid")}</Button>}</td></tr>)}</tbody></table></div>}
    </div>}
  </section>;
}

function Field({ label, name, type = "text", required = false, min, max, step, defaultValue }: { label: string; name: string; type?: string; required?: boolean; min?: string; max?: string; step?: string; defaultValue?: string }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span><input name={name} type={type} required={required} min={min} max={max} step={step} defaultValue={defaultValue} className={inputClass} /></label>;
}

function EmployeeSelect({ label, employees }: { label: string; employees: Employee[] }) {
  const t = useTranslations("hr");
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span><select name="employeeId" required className={inputClass} defaultValue=""><option value="" disabled>{t("fields.selectEmployee")}</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>;
}

function StatusSelect({ label, name, values, translate, group }: { label: string; name: string; values: string[]; translate: (key: never) => string; group: "attendance" | "transaction" }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span><select name={name} className={inputClass} defaultValue={values[0]}>{values.map((value) => <option key={value} value={value}>{translate(`status.${group}.${value}` as never)}</option>)}</select></label>;
}

function RecordTable({ title, empty, headers, rows }: { title: string; empty: string; headers: string[]; rows: string[][] }) {
  return <section><h2 className="mb-3 text-lg font-bold text-navy dark:text-slate-100">{title}</h2>{!rows.length ? <EmptyState title={empty} detail={empty} /> : <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><table className="min-w-full text-start text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800"><tr>{headers.map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${index}-${row[0]}`} className="border-t border-slate-100 dark:border-slate-800">{row.map((value, cellIndex) => <td key={`${cellIndex}-${value}`} className="p-3">{value}</td>)}</tr>)}</tbody></table></div>}</section>;
}

function employeeName(employees: Employee[], id: string) { return employees.find((employee) => employee.id === id)?.name ?? "—"; }

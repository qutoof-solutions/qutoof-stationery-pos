import assert from "node:assert/strict";
import test from "node:test";
import { calculatePayroll, getPayrollPeriod } from "../lib/hr/payroll";

test("payroll month boundaries are stable, including December rollover", () => {
  assert.deepEqual(getPayrollPeriod(2026, 2), { startDate: "2026-02-01", endDateExclusive: "2026-03-01" });
  assert.deepEqual(getPayrollPeriod(2026, 12), { startDate: "2026-12-01", endDateExclusive: "2027-01-01" });
});

test("payroll adds bonuses and subtracts advances, penalties and deductions", () => {
  assert.deepEqual(calculatePayroll(100_000, [
    { type: "bonus", amountMinor: 5_000 },
    { type: "advance_loan", amountMinor: 10_000 },
    { type: "penalty", amountMinor: 2_000 },
    { type: "deduction", amountMinor: 3_000 },
  ]), { basicSalaryMinor: 100_000, totalBonusesMinor: 5_000, totalDeductionsMinor: 15_000, netSalaryMinor: 90_000 });
});

test("payroll net salary never becomes negative", () => {
  assert.equal(calculatePayroll(100, [{ type: "deduction", amountMinor: 250 }]).netSalaryMinor, 0);
});

test("payroll period and money inputs are validated", () => {
  assert.throws(() => getPayrollPeriod(2026, 13), RangeError);
  assert.throws(() => calculatePayroll(-1, []), RangeError);
  assert.throws(() => calculatePayroll(100, [{ type: "bonus", amountMinor: 0 }]), RangeError);
});

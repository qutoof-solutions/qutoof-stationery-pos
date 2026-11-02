export type HrTransactionType = "advance_loan" | "bonus" | "penalty" | "deduction";
export type HrPayrollTransaction = { type: HrTransactionType; amountMinor: number };

export function getPayrollPeriod(year: number, month: number): { startDate: string; endDateExclusive: string } {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) throw new RangeError("Invalid payroll year");
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError("Invalid payroll month");
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDateExclusive = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { startDate, endDateExclusive };
}

export function calculatePayroll(basicSalaryMinor: number, transactions: readonly HrPayrollTransaction[]): { basicSalaryMinor: number; totalBonusesMinor: number; totalDeductionsMinor: number; netSalaryMinor: number } {
  if (!Number.isSafeInteger(basicSalaryMinor) || basicSalaryMinor < 0) throw new RangeError("Invalid basic salary");
  let totalBonusesMinor = 0;
  let totalDeductionsMinor = 0;
  for (const transaction of transactions) {
    if (!Number.isSafeInteger(transaction.amountMinor) || transaction.amountMinor <= 0) throw new RangeError("Invalid transaction amount");
    if (transaction.type === "bonus") totalBonusesMinor += transaction.amountMinor;
    else totalDeductionsMinor += transaction.amountMinor;
  }
  const gross = basicSalaryMinor + totalBonusesMinor;
  if (!Number.isSafeInteger(gross) || !Number.isSafeInteger(totalDeductionsMinor)) throw new RangeError("Payroll total exceeds the supported range");
  return { basicSalaryMinor, totalBonusesMinor, totalDeductionsMinor, netSalaryMinor: Math.max(0, gross - totalDeductionsMinor) };
}

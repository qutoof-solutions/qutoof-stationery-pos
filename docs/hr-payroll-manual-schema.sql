-- Light HR & Payroll schema for Cloudflare D1 (SQLite).
-- Manual execution only. Run after deploying the application code, and do not apply via Wrangler migrations.
-- Monetary *_minor values use the application's minor-unit convention (100 units = 1 EGP).

CREATE TABLE IF NOT EXISTS hr_employees (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  basic_salary_minor INTEGER NOT NULL DEFAULT 0 CHECK (basic_salary_minor >= 0),
  join_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS hr_employees_tenant_id_uq ON hr_employees (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS hr_employees_tenant_user_uq ON hr_employees (tenant_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS hr_employees_tenant_status_idx ON hr_employees (tenant_id, status);
CREATE INDEX IF NOT EXISTS hr_employees_tenant_name_idx ON hr_employees (tenant_id, name);

CREATE TABLE IF NOT EXISTS hr_attendance (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  date TEXT NOT NULL,
  check_in TEXT,
  check_out TEXT,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave', 'late')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id, employee_id) REFERENCES hr_employees (tenant_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS hr_attendance_tenant_employee_date_uq ON hr_attendance (tenant_id, employee_id, date);
CREATE INDEX IF NOT EXISTS hr_attendance_tenant_date_idx ON hr_attendance (tenant_id, date);
CREATE INDEX IF NOT EXISTS hr_attendance_tenant_employee_idx ON hr_attendance (tenant_id, employee_id, date);

CREATE TABLE IF NOT EXISTS hr_transactions (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('advance_loan', 'bonus', 'penalty', 'deduction')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  date TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id, employee_id) REFERENCES hr_employees (tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS hr_transactions_tenant_employee_date_idx ON hr_transactions (tenant_id, employee_id, date);

CREATE TABLE IF NOT EXISTS hr_custody (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  given_date TEXT NOT NULL,
  return_date TEXT,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'returned')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id, employee_id) REFERENCES hr_employees (tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS hr_custody_tenant_employee_status_idx ON hr_custody (tenant_id, employee_id, status);

CREATE TABLE IF NOT EXISTS hr_payroll (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  basic_salary_minor INTEGER NOT NULL,
  total_bonuses_minor INTEGER NOT NULL DEFAULT 0,
  total_deductions_minor INTEGER NOT NULL DEFAULT 0,
  net_salary_minor INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (month BETWEEN 1 AND 12 AND year BETWEEN 2000 AND 9999),
  CHECK (basic_salary_minor >= 0 AND total_bonuses_minor >= 0 AND total_deductions_minor >= 0 AND net_salary_minor >= 0),
  FOREIGN KEY (tenant_id, employee_id) REFERENCES hr_employees (tenant_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS hr_payroll_tenant_employee_period_uq ON hr_payroll (tenant_id, employee_id, year, month);
CREATE INDEX IF NOT EXISTS hr_payroll_tenant_period_idx ON hr_payroll (tenant_id, year, month);

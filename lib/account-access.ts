export type AccountAccessStatus = "active" | "suspended";

export function isAccountSuspended(status: string | null | undefined): boolean {
  return status === "suspended";
}

export function nextAccountAccessStatus(action: "suspend_account" | "reactivate_account"): AccountAccessStatus {
  return action === "suspend_account" ? "suspended" : "active";
}

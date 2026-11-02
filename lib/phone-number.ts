const EASTERN_ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function toAsciiDigits(value: string): string {
  return [...value].map((character) => {
    const eastern = EASTERN_ARABIC_DIGITS.indexOf(character);
    if (eastern >= 0) return String(eastern);
    const persian = PERSIAN_DIGITS.indexOf(character);
    return persian >= 0 ? String(persian) : character;
  }).join("");
}

/** Normalize a user-entered international or Egyptian local phone number. */
export function normalizePhoneNumber(value: string): string | null {
  const input = toAsciiDigits(value.trim());
  if (!input || !/^\+?[0-9\s().-]+$/.test(input) || (input.includes("+") && !input.startsWith("+"))) return null;
  const digits = input.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  if (input.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (/^01[0-9]{9}$/.test(digits)) return `+20${digits.slice(1)}`;
  return digits;
}

/** Convert a stored number to the digits-only form required by wa.me. */
export function toWhatsAppDigits(value: string | null | undefined): string | null {
  if (!value) return null;
  const input = toAsciiDigits(value.trim());
  if (!/^\+?[0-9\s().-]+$/.test(input) || (input.includes("+") && !input.startsWith("+"))) return null;
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `20${digits.slice(1)}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

const PREFIX = "+998";

const MOBILE_PREFIXES = new Set([
  "50",
  "55",
  "77",
  "88",
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
  "97",
  "98",
  "99",
]);

export function formatUzPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
  if (!digits) return PREFIX;
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)]
    .filter((p) => p.length > 0)
    .join(" ");
  return `${PREFIX} ${parts}`.trim();
}

export function digitsOf(value: string): string {
  return value.replace(/\D/g, "").replace(/^998/, "");
}

export function isValidUzPhone(value: string): boolean {
  const digits = digitsOf(value);
  if (digits.length !== 9) return false;
  return MOBILE_PREFIXES.has(digits.slice(0, 2));
}

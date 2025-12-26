// src/utils/phone.js
export function normalizeCI(number) {
  if (!number) return null;
  let n = number.toString().replace(/\s+/g, "");

  if (n.startsWith("+")) return n;
  if (/^0\d{9}$/.test(n)) return "+225" + n; // on garde le 0
  if (/^\d{10}$/.test(n)) return "+225" + n;

  return null;
}

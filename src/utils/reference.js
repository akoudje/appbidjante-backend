export function generateReference(prefix) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 1000);
  return `${prefix}-${date}-${rand}`;
}

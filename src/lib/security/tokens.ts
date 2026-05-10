export function generateRandomToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

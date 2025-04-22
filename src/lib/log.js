export function getCurrentDateTime() {
  return new Date().toISOString().split("T").join(" ").slice(0, -5);
}

export function log(message) {
  console.log(`[${getCurrentDateTime()}] ${message}`);
}

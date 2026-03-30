import dayjs from "dayjs";
import fs from "fs";
import path from "path";

// open file to write (create if not exist)
const logPath = path.join(__dirname, "..", "logs", `log_${getCurrentDate()}.txt`);
if (!fs.existsSync(path.dirname(logPath))) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
}
const logFile = fs.createWriteStream(logPath, { flags: "a" });

function getCurrentDateTime(): string {
  // return new Date().toISOString().split("T").join(" ").slice(0, -5);
  return dayjs().format("YYYY-MM-DD HH:mm:ss");
}

function getCurrentDate(): string {
  return dayjs().format("YYYY-MM-DD");
}

export function log(message: string): void {
  console.log(`[${getCurrentDateTime()}] ${message}`);
  logFile.write(`[${getCurrentDateTime()}] ${message}\n`);
}

export function logError(error: unknown): void {
  const message = error instanceof Error ? error.stack : String(error);
  console.error(`[${getCurrentDateTime()}] <ERROR> ${message}`);
  logFile.write(`[${getCurrentDateTime()}] <ERROR> ${message}\n`);
}

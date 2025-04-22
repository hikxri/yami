import dayjs from "dayjs";
import fs from "fs";
import path from "path";

// open file to write (create if not exist)
const logPath = path.join(__dirname, "..", "logs", `log_${getCurrentDate()}.txt`);
if (!fs.existsSync(path.dirname(logPath))) {
    fs.writeFileSync(path.dirname(logPath), "", { recursive: true });
}
const logFile = fs.createWriteStream(logPath, { flags: "a" });

function getCurrentDateTime() {
  // return new Date().toISOString().split("T").join(" ").slice(0, -5);
  return dayjs().format("YYYY-MM-DD HH:mm:ss");
}

function getCurrentDate() {
  return dayjs().format("YYYY-MM-DD");
}

export function log(message) {
  console.log(`[${getCurrentDateTime()}] ${message}`);
  logFile.write(`[${getCurrentDateTime()}] ${message}\n`);
}

export function logError(error) {
  error = error instanceof Error ? error.stack : String(error);
  console.error(`[${getCurrentDateTime()}] <ERROR> ${error}`);
  logFile.write(`[${getCurrentDateTime()}] <ERROR> ${error}\n`);
}
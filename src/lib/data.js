import path from "path";
import fs from "fs";
import { log } from "./log";

export function getDataFile() {
  const dataPath = path.join(__dirname, "..", "data.json");
  const dataFile = fs.readFileSync(dataPath, "utf8");
  const dataJson = JSON.parse(dataFile);

  return dataJson;
}

export function writeDataFile(data) {
  const dataPath = path.join(__dirname, "..", "data.json");
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  log("data.json updated");
}
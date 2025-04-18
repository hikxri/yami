import path from "path";
import fs from "fs";

export function getDataFile() {
  const dataPath = path.join(__dirname, "..", "data.json");
  const dataFile = fs.readFileSync(dataPath, "utf8");
  const dataJson = JSON.parse(dataFile);

  return dataJson;
}

export function writeDataFile(data) {
  const dataPath = path.join(__dirname, "..", "data.json");
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  console.log("data.json updated");
}
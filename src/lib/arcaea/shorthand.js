import path from "path";
import fs from "fs";

export function getShorthandFile() {
  const dataPath = path.join(__dirname, ".", "shorthand.json");
  const dataFile = fs.readFileSync(dataPath, "utf8");
  const dataJson = JSON.parse(dataFile);

  return dataJson;
}

export function filterName(input) {
  const replaces = [".", "'", "’", ",", "&"];

  input = input.toLowerCase().trim();
  replaces.forEach((rp) => input = input.replaceAll(rp, ""));

  return input;
}
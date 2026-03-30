import path from "path";
import fs from "fs";

export function getShorthandFile(): Record<string, string[]> {
  const dataPath = path.join(__dirname, ".", "shorthand.json");
  const dataFile = fs.readFileSync(dataPath, "utf8");
  const dataJson = JSON.parse(dataFile);

  return dataJson;
}

export function filterName(input: string) {
  const replaces = [".", "'", "’", ",", "&"];

  input = input.toLowerCase().trim();
  replaces.forEach((rp) => input = input.replaceAll(rp, ""));

  return input;
}

// export function writeShorthandFile(data) {
//   const dataPath = path.join(__dirname, "..", "data.json");
//   fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

//   console.log("data.json updated");
// }
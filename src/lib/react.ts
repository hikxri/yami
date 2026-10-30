import fs from "fs";
import path from "path";
import { log } from "./log";

type ReactionObject = {
  name: string;
  value: string;
}

export function getReactionImage(id: string): Buffer | null {
  const filePath = path.join(__dirname, "..", "assets", "reactions", id);
  if (!fs.existsSync(filePath)) return null;
  const file = fs.readFileSync(filePath);

  log(`Asset at ${filePath} is read`);
  
  return file;
}

export function getReactionList(): ReactionObject[] {
  const filePath = path.join(__dirname, "..", "assets", "reactions", "reactions.json");
  const file = fs.readFileSync(filePath, "utf8");
  const raw = JSON.parse(file);

  const json = Object.keys(raw).map((key) => ({ name: key, value: raw[key] }));

  return json;
}
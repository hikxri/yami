import path from "path";
import fs from "fs";
import { log } from "./log";

export function loadCacheData(filePath) {
  const cachePath = path.join(__dirname, "..", "cache", filePath);
  if (!fs.existsSync(cachePath)) return null;
  const cacheFile = fs.readFileSync(cachePath, "utf8");
  const cacheJson = JSON.parse(cacheFile);

  log(`Cache at ${filePath} is read`);

  return cacheJson;
}

export function loadCacheImage(filePath) {
  const cachePath = path.join(__dirname, "..", "cache", filePath);
  if (!fs.existsSync(cachePath)) return null;
  const cacheFile = fs.readFileSync(cachePath);

  log(`Cache at ${filePath} is read`);

  return cacheFile;
}

export function writeCacheData(filePath, data) {
  const cachePath = path.join(__dirname, "..", "cache", filePath);

  // create dir if not exist
  if (!fs.existsSync(path.dirname(cachePath))) {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  }

  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
  log(`Cache at ${filePath} is updated`);
}

export function writeCacheImage(filePath, buffer) {
  const cachePath = path.join(__dirname, "..", "cache", filePath);

  // create dir if not exist
  if (!fs.existsSync(path.dirname(cachePath))) {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  }

  fs.writeFileSync(cachePath, buffer);
  log(`Cache at ${filePath} is updated`);
}
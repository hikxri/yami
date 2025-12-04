/*
 * script to get all song names (distinct) in arcaea
 */

import { getSongNameList } from "../lib/arcaea/api";
import fs from "fs";

const temp = await getSongNameList();
const songNameList = temp.map((song) => song[0]);
const songNameSet = [...new Set(songNameList)].sort((a, b) => a.localeCompare(b));

const songNameRecord: Record<string, string[]> = {};
for (const songName of songNameSet) {
  songNameRecord[songName] = [];
}

fs.writeFileSync("./song-names.json", JSON.stringify(songNameRecord, null, 2));
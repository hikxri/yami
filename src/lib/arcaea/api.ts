import Papa from "papaparse";
import type { Difficulty, SongRow } from "./types";

// parent key: url (id): string
// child key: difficulty: Difficulty
// value: song data with headers: SongRow
/*
{
  url: {
    difficulty: {
      title: ...,
      artist:...,
      ...
    },
  }
}
*/
export async function getSongsData(): Promise<Record<string, Record<Difficulty, SongRow>>> {
  const scoresText = await fetch(
    "https://raw.githubusercontent.com/hikxri/arcaea-b30-web/main/public/scores.csv"
  ).then((res) => res.text());

  const rows = await new Promise<SongRow[]>((resolve, reject) => {
    Papa.parse<SongRow>(scoresText, {
      header: true,
      encoding: "utf-8",
      complete: (results) => resolve(results.data),
      error: (error: Error) => reject(error),
    });
  });

  const result: Record<string, Record<string, SongRow>> = {};

  for (const row of rows) {
    if (!row.url) continue;

    if (!result[row.url]) {
      result[row.url] = {};
    }

    result[row.url][row.difficulty] = row;
  }

  return result;
}

export async function getSongNameMap() {
  const songNameMap = await fetch("https://raw.githubusercontent.com/hikxri/arcaea-b30-web/main/public/songNameMap.json")
    .then((res) => res.json());

  return songNameMap;
}

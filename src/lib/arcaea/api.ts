import Papa from "papaparse";

export async function getSongNameList(): Promise<string[][]> {
  const scoresText = await fetch("https://raw.githubusercontent.com/hikxri/arcaea-b30-web/main/public/scores.csv")
    .then((res) => res.text());

  const rows = await new Promise<string[][]>((resolve, reject) => {
    Papa.parse<string[]>(scoresText, {
      header: false,
      encoding: "utf-8",
      complete: (results) => {
        resolve(results.data);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });

  const songNameList = rows.slice(1);

  return songNameList;
}

export async function getSongNameMap() {
  const songNameMap = await fetch("https://raw.githubusercontent.com/hikxri/arcaea-b30-web/main/public/songNameMap.json")
    .then((res) => res.json());

  return songNameMap;
}

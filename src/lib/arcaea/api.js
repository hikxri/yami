import Papa from "papaparse";

export async function getSongNameList() {
  const scoresText = await fetch("https://raw.githubusercontent.com/hikxri/arcaea-b30-web/main/public/scores.csv")
    .then((res) => res.text());

  const parsePromise = new Promise((resolve, reject) => {
    Papa.parse(scoresText, {
      header: false,
      encoding: "utf-8",
      complete: function(results) {
        resolve(results.data.slice(1));
      },
      error: function(error) {
        reject(error);
      },
    });
  });

  if (parsePromise) {
    const songNameList = await parsePromise;
    return songNameList;
  }
}

export async function getSongNameMap() {
  const songNameMap = await fetch("https://raw.githubusercontent.com/hikxri/arcaea-b30-web/main/public/songNameMap.json")
    .then((res) => res.json());

  return songNameMap;
}
import sharp from "sharp";
import { getSongsData, getSongNameMap } from "./api";
import type { Difficulty } from "./types";

export const songNameMap = await getSongNameMap();
export const songsData = await getSongsData();
export const songNames = getSongNames();

// key: song name - artist
// value: wiki URL
function getSongNames(): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [url, diffs] of Object.entries(songsData)) {
    for (const row of Object.values(diffs)) {
      if (!row) continue;

      const key = `${row.title} - ${row.artist}`
      result[key] = url;
    }
  }

  return result;
}

export async function getSongJacket(id: string, diff: Difficulty): Promise<Buffer> {
  const baseUrl = "https://raw.githubusercontent.com/hikxri/arcaea-b30-web/main/public/jackets/";

  const fileName = songsData[id][diff].jacket;
  if (!fileName) throw new Error(`Song jacket: ${id} | ${diff} not found in data!`);

  const res = await fetch(`${baseUrl}/${fileName}`);
  if (!res.ok) throw new Error(`Song jacket: ${id} | ${diff} not found in repository!`);

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// helper function for getRandomSongJacket
function getRandomSongId(): [string, Difficulty] {
  const songIds = Object.keys(songsData);
  const songId = songIds[Math.floor(Math.random() * songIds.length)];

  const difficulties = Object.keys(songsData[songId]) as Difficulty[];
  const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

  return [songId, difficulty];
}

export async function getRandomSongJacket(size: number): Promise<{
  jacket: Buffer;
  id: string;
  title: string;
  originalJacket: Buffer;
  left: number;
  top: number;
  width: number;
  height: number;
}> {
  const [id, diff] = getRandomSongId();

  const originalJacket = await getSongJacket(id, diff);

  const title = songsData[id][diff].title;

  const temp = sharp(originalJacket);
  const metadata = await temp.metadata();
  const mWidth = metadata.width || 600;
  const mHeight = metadata.height || 600;
  const xPadding = 100;
  const yPadding = 100;
  const width = size;  // 256
  const height = size; // 256
  const left = Math.floor(Math.random() * (mWidth - width - xPadding * 2) + xPadding);
  const top = Math.floor(Math.random() * (mHeight - height - yPadding * 2) + yPadding);
  const jacket = await temp
    .extract({
      left: left,
      top: top,
      width: width,
      height: height,
    })
    .resize(128, 128)
    .toBuffer();

  return {
    jacket: jacket,
    id: id,
    title: title,
    originalJacket: originalJacket,
    left: left,
    top: top,
    width: width,
    height: height,
  };
}

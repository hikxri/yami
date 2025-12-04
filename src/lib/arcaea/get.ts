import sharp from "sharp";
import { getSongNameList, getSongNameMap } from "./api";
import type { Diffculty } from "./types";

export const songNameMap = await getSongNameMap();
export const songNameList = await getSongNameList();

export async function getSongJacket(title: string, diff: Diffculty): Promise<Buffer> {
  const songName = (songNameMap[title] || title)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/!|\*|#|\[|\]|\?|:|,|\||\\/g, "");

  const diffPath = `${songName}_${diff.toLowerCase()}.jpg`;
  const basePath = `${songName}.jpg`;

  const baseUrl = "https://raw.githubusercontent.com/hikxri/arcaea-b30-web/main/public/jackets/";

  try {
    const res = await fetch(`${baseUrl}/${diffPath}`);
    if (!res.ok) throw new Error("Diff jacket not found");

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    const res = await fetch(`${baseUrl}/${basePath}`);
    if (!res.ok) throw new Error(`Song jacket: ${songName} | ${diff} not found`);

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// helper function for getRandomSongJacket
function getRandomSongName(): [string, Diffculty] {
  const song = songNameList[Math.floor(Math.random() * songNameList.length)];
  return [song[0], song[1] as Diffculty];
}

export async function getRandomSongJacket(size: number): Promise<{
  jacket: Buffer;
  title: string;
  originalJacket: Buffer;
  left: number;
  top: number;
  width: number;
  height: number;
}> {
  const [title, diff] = getRandomSongName();

  const originalJacket = await getSongJacket(title, diff);

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
    title: title,
    originalJacket: originalJacket,
    left: left,
    top: top,
    width: width,
    height: height,
  };
}

import { loadCacheData, loadCacheImage, writeCacheData, writeCacheImage } from "../cache";
import { log } from "../log";
import { getLatestVersion, getCharacterList, getItemList, getCharacterData } from "./api";
import sharp from "sharp";

// initial load
export const latestVersion = await getLatestVersion();

/*
characterList : list of champion IDs
characterNames : object of {champion IDs : champion names}
itemList: list of items IDs
itemNames: object of {item IDs : item names}
*/

const charactersData = loadCacheData(`lol/${latestVersion}/champions/champions.json`);
let characterList: string[], characterNames: Record<string, string>;

if (!charactersData) {
  log("Champion data not found, fetching from API...");
  const data = await getCharacterList(latestVersion);
  characterList = data.characterList;
  characterNames = data.characterNames;

  log("Caching champion data...");
  writeCacheData(`lol/${latestVersion}/champions/champions.json`, data);
} else {
  characterList = charactersData.characterList;
  characterNames = charactersData.characterNames;
}

const itemsData = loadCacheData(`lol/${latestVersion}/items/items.json`);
let itemList: string[],
  itemNames: Record<string, string>,
  itemNamesSet: string[],
  itemMaps: Record<string, string>,
  items: Record<string, any>;

if (!itemsData) {
  log("Item data not found, fetching from API...");
  const data = await getItemList(latestVersion);
  items = data.items;
  itemNames = data.itemNames;
  itemNamesSet = data.itemNamesSet;
  itemMaps = data.itemMaps;
  itemList = Object.keys(itemNames);

  log("Caching item data...");
  writeCacheData(`lol/${latestVersion}/items/items.json`, data);
} else {
  items = itemsData.items;
  itemNames = itemsData.itemNames;
  itemNamesSet = itemsData.itemNamesSet;
  itemMaps = itemsData.itemMaps;
  itemList = Object.keys(itemNames);
}

// for archive
export { characterNames, itemNamesSet, itemMaps, items };

export async function getCharacterInfo(name: string): Promise<Record<string, any>> {
  let characterData: Record<string, any> = loadCacheData(`lol/${latestVersion}/champions/${name}/${name}.json`);
  if (!characterData) {
    log(`${name}.json not found, fetching from API...`);
    characterData = await getCharacterData(name);

    log("Caching character data...");
    writeCacheData(`lol/${latestVersion}/champions/${name}/${name}.json`, characterData);
  }

  return characterData;
}

export async function getItemIcon(itemId: string): Promise<Buffer | null> {
  let itemIcon: Buffer | null = loadCacheImage(`lol/${latestVersion}/items/${itemId}.png`);

  if (itemIcon) {
    return itemIcon;
  }

  log(`${itemId}.png not found, fetching from API...`);

  const response: Response = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${itemId}.png`
  );
  if (!response.ok) {
    return null;
  }
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  itemIcon = Buffer.from(buffer);
  log("Caching item icon...");
  writeCacheImage(`lol/${latestVersion}/items/${itemId}.png`, itemIcon);
  return itemIcon;
}

export async function getAbilityIcon(name: string, key: string, url: string | null = null): Promise<Buffer | null> {
  let spellIcon: Buffer | null = loadCacheImage(`lol/${latestVersion}/champions/${name}/ability${key}.png`);
  if (!spellIcon) {
    log(`ability${key}.png not found, fetching from API...`);
    if (!url) {
      const characterData = await getCharacterInfo(name);
      url = characterData.abilities[key][0].icon;
    }
    const response = await fetch(url || "");
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    spellIcon = Buffer.from(buffer);
    log("Caching ability icon...");
    writeCacheImage(`lol/${latestVersion}/champions/${name}/ability${key}.png`, spellIcon);
  }

  return spellIcon;
}

export async function getSkinSplash(characterName: string, skinId: string, url: string): Promise<Buffer | null> {
  let splash: Buffer | null = loadCacheImage(`lol/${latestVersion}/skins/${characterName}/${skinId}.png`);

  if (splash) return splash;

  log(`${skinId}.png not found, fetching from API...`);

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  splash = Buffer.from(buffer);
  log("Caching skin splash...");
  writeCacheImage(`lol/${latestVersion}/skins/${characterName}/${skinId}.png`, splash);
  return splash;
}

export type RandomAbility = {
  key: string;
  name: string;
  champion: string;
  icon: Buffer;
  originalIcon: Buffer;
};

export async function getRandomAbility(): Promise<RandomAbility> {
  const characterName = characterList[Math.floor(Math.random() * characterList.length)];

  const characterData = await getCharacterInfo(characterName);

  const abilityKeys = Object.keys(characterData.abilities);
  const abilities = Object.fromEntries(
    abilityKeys.map((key) => [
      key,
      {
        name: characterData.abilities[key][0].name,
        icon: characterData.abilities[key][0].icon,
      },
    ])
  );

  const key = abilityKeys[Math.floor(Math.random() * abilityKeys.length)];

  const spellIcon = await getAbilityIcon(characterName, key, abilities[key].icon);

  // ensure spellIcon is a Buffer
  if (!spellIcon) {
    throw new Error("spellIcon is null");
  }

  const buffer = await sharp(spellIcon).resize(128, 128).toBuffer();
  const output = await sharp(buffer).blur(7).greyscale().toBuffer();

  return {
    key: key,
    name: abilities[key].name,
    champion: characterNames[characterName],
    icon: output,
    originalIcon: buffer,
  };
}

export type RandomItem = {
  name: string;
  icon: Buffer;
};

export async function getRandomItem(): Promise<RandomItem> {
  const itemId = itemList[Math.floor(Math.random() * itemList.length)];

  const itemIcon = await getItemIcon(itemId);

  // ensure itemIcon is a Buffer
  if (!itemIcon) {
    throw new Error("itemIcon is null");
  }

  const buffer = await sharp(itemIcon).resize(128, 128).toBuffer();

  return {
    name: itemNames[itemId],
    icon: buffer,
  };
}

export type RandomSkin = {
  champion: string;
  skin: string;
  set: string[];
  originalSplash: Buffer;
  splash: Buffer;
  left: number;
  top: number;
  width: number;
  height: number;
};

export async function getRandomSkin(initialSize: number): Promise<RandomSkin> {
  const characterName = characterList[Math.floor(Math.random() * characterList.length)];
  const characterData = await getCharacterInfo(characterName);

  const skins = characterData.skins.map((skin: Record<string, any>) => {
    return {
      name: skin.name,
      id: skin.id,
      splash: skin.splashPath,
      set: skin.set,
    };
  });

  const skin = skins[Math.floor(Math.random() * skins.length)];

  const originalSplash = await getSkinSplash(characterName, skin.id, skin.splash);

  if (!originalSplash) {
    throw new Error("originalSplash is null");
  }

  const temp = sharp(originalSplash);
  const metadata = await temp.metadata();
  const mWidth = metadata.width || 1280;
  const mHeight = metadata.height || 720;
  const xPadding = 200;
  const yPadding = 100;
  const width = initialSize;
  const height = initialSize;
  const left = Math.floor(Math.random() * (mWidth - width - xPadding * 2) + xPadding);
  const top = Math.floor(Math.random() * (mHeight - height - yPadding * 2) + yPadding);
  const splash = await temp
    .extract({
      left: left,
      top: top,
      width: width,
      height: height,
    })
    .resize(128, 128)
    .toBuffer();

  return {
    champion: characterNames[characterName],
    skin: skin.name,
    set: skin.set,
    originalSplash: originalSplash,
    splash: splash,
    left: left,
    top: top,
    width: width,
    height: height,
  };
}

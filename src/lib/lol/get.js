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
let characterList, characterNames;

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
let itemList, itemNames, itemNamesSet, itemMaps, items;

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

export async function getCharacterInfo(name) {
  let characterData = loadCacheData(
    `lol/${latestVersion}/champions/${name}/${name}.json`,
  );
  if (!characterData) {
    log(`${name}.json not found, fetching from API...`);
    characterData = await getCharacterData(name);

    log("Caching character data...");
    writeCacheData(
      `lol/${latestVersion}/champions/${name}/${name}.json`,
      characterData,
    );
  }

  return characterData;
}

export async function getItemIcon(itemId) {
  let itemIcon = loadCacheImage(`lol/${latestVersion}/items/${itemId}.png`);

  if (itemIcon) {
    return itemIcon;
  }

  log(`${itemId}.png not found, fetching from API...`);

  itemIcon = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${itemId}.png`,
  );
  if (!itemIcon.ok) {
    return null;
  }
  const blob = await itemIcon.blob();
  const buffer = await blob.arrayBuffer();
  itemIcon = Buffer.from(buffer);
  log("Caching item icon...");
  writeCacheImage(`lol/${latestVersion}/items/${itemId}.png`, itemIcon);
  return itemIcon;
}

export async function getAbilityIcon(name, key, url = null) {
  let spellIcon = loadCacheImage(
    `lol/${latestVersion}/champions/${name}/ability${key}.png`,
  );
  if (!spellIcon) {
    log(`ability${key}.png not found, fetching from API...`);
    if (!url) {
      const characterData = await getCharacterInfo(name);
      url = characterData.abilities[key][0].icon;
    }
    spellIcon = await fetch(url);
    if (!spellIcon.ok) {
      return null;
    }
    const blob = await spellIcon.blob();
    const buffer = await blob.arrayBuffer();
    spellIcon = Buffer.from(buffer);
    log("Caching ability icon...");
    writeCacheImage(`lol/${latestVersion}/champions/${name}/ability${key}.png`, spellIcon);
  }

  return spellIcon;
}

export async function getSkinSplash(characterName, skinId, url) {
  let splash = loadCacheImage(
    `lol/${latestVersion}/skins/${characterName}/${skinId}.png`,
  );

  if (splash) return splash;

  log(`${skinId}.png not found, fetching from API...`);

  splash = await fetch(url);
  if (!splash.ok) {
    return null;
  }
  const blob = await splash.blob();
  const buffer = await blob.arrayBuffer();
  splash = Buffer.from(buffer);
  log("Caching skin splash...");
  writeCacheImage(
    `lol/${latestVersion}/skins/${characterName}/${skinId}.png`,
    splash,
  );
  return splash;
}


export async function getRandomAbility() {
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
    ]),
  );

  const key = abilityKeys[Math.floor(Math.random() * abilityKeys.length)];

  const spellIcon = await getAbilityIcon(characterName, key, abilities[key].icon);

  // ensure spellIcon is a Buffer

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

export async function getRandomItem() {
  const itemId = itemList[Math.floor(Math.random() * itemList.length)];

  const itemIcon = await getItemIcon(itemId);

  const buffer = await sharp(itemIcon).resize(128, 128).toBuffer();
  const output = await sharp(buffer).blur(7).greyscale().toBuffer();

  return {
    name: itemNames[itemId],
    icon: output,
    originalIcon: buffer,
  };
}

export async function getRandomSkin() {
  const characterName = characterList[Math.floor(Math.random() * characterList.length)];
  const characterData = await getCharacterInfo(characterName);

  const skins = characterData.skins.map((skin) => {
    return {
      name: skin.name,
      id: skin.id,
      splash: skin.splashPath,
      set: skin.set,
    };
  });

  const skin = skins[Math.floor(Math.random() * skins.length)];

  const originalSplash = await getSkinSplash(
    characterName,
    skin.id,
    skin.splash,
  );
  const temp = sharp(originalSplash);
  const metadata = await temp.metadata();
  const mWidth = metadata.width || 1280;
  const mHeight = metadata.height || 720;
  const xPadding = 200;
  const yPadding = 100;
  const width = 256;
  const height = 256;
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

export async function enlargeSplash(original, px, left, top, width, height, size) {
  const splash = sharp(original);
  const metadata = await splash.metadata();

  // constrain extraction to not exceed the original image dimensions
  if (height >= metadata.height) {
    return {
      result: splash.extract({
        left: metadata.width / 2 - metadata.height / 2,
        top: 0,
        width: metadata.height,
        height: metadata.height,
      }),
      left: left,
      top: top,
      width: width,
      height: height,
      size: size,
    };
  }

  left = Math.max(left - px, 0);
  top = Math.max(top - px, 0);
  const temp = width;
  width = left + width + px * 2 > metadata.width ? metadata.width - left : width + px * 2;
  height = top + height + px * 2 > metadata.height ? metadata.height - top : height + px * 2;
  const scaleFactor = width / temp;
  size = Math.floor(size * scaleFactor);

  const result = await splash.extract({
    left: left,
    top: top,
    width: width,
    height: height,
  })
    .resize(size, size)
    .toBuffer();

  return {
    result: result,
    left: left,
    top: top,
    width: width,
    height: height,
    size: size,
  };
}

import { log } from "../log";

// get latest version
export async function getLatestVersion() {
  const latestVersion = await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
    .then((res) => res.json())
    .then((res) => res[0]);

  log(`Current LoL version: ${latestVersion}`);
  return latestVersion;
}

// get array of all characters
export async function getCharacterList(version) {
  const characters = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
  )
    .then((res) => res.json())
    .then((res) => res.data);

  const characterList = Object.keys(characters);
  const characterNames = Object.entries(characters).reduce((acc, [id, obj]) => {
    acc[id] = obj.name;
    return acc;
  }, {});

  return {
    characterList: characterList,
    characterNames: characterNames,
  };
}

// get array of all items
export async function getItemList(version) {
  const items = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`,
  )
    .then((res) => res.json())
    .then((res) => res.data);

  const itemNames = Object.entries(items).reduce((acc, [id, obj]) => {
    acc[id] = obj.name;
    return acc;
  }, {});

  const temp = new Set(
    Object.values(itemNames),
  );
  const itemNamesSet = [...temp];
  const itemMaps = Object.entries(items).reduce((acc, [id, obj]) => {
    const maps = Object.keys(obj.maps).filter((map) => obj.maps[map]);
    const mapsArr = maps.length > 0 ? maps.map((map) => ({ id: id, map: map })) : [{ id: id, map: "0" }];
    if (acc[obj.name] === undefined) {
      acc[obj.name] = mapsArr;
    } else {
      acc[obj.name] = [...acc[obj.name], ...mapsArr];
    }
    return acc;
  }, {});

  return {
    items: items,
    itemNames: itemNames,
    itemNamesSet: itemNamesSet,
    itemMaps: itemMaps,
  };
}

export async function getCharacterData(characterName) {
  const characterData = await fetch(
    `https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions/${characterName}.json`,
  ).then((res) => res.json());

  return characterData;
}

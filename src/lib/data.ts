import path from "path";
import fs from "fs";
import { log } from "./log";
import type { GuildGameSettings, SplashGames, SplashGameSettings } from "./games/types";

export type Data = {
  testing: boolean;
  greeting: boolean;
  test_users: string[];
  test_commands: string[];
  count: {
    guild_id: string;
    number: number;
  }[];
  game_settings: GuildGameSettings[];
};

const defaultSplashGameSettings: Record<SplashGames, SplashGameSettings> = {
  "arcaea-jacket": {
    initial_size: 64,
    size_increase: 32,
    auto_hint: true,
    auto_hint_interval: 5,
  },
  "lol-skin": {
    initial_size: 128,
    size_increase: 32,
    auto_hint: true,
    auto_hint_interval: 3,
  },
};

export const splashGames = Object.keys(defaultSplashGameSettings) as SplashGames[];
export const splashGameSettings = Object.keys(defaultSplashGameSettings[splashGames[0]]) as (keyof SplashGameSettings)[];

export function getDataFile(): Data {
  const dataPath = path.join(__dirname, "..", "data.json"); 
  const dataFile = fs.readFileSync(dataPath, "utf8");
  const dataJson = JSON.parse(dataFile);

  return dataJson;
}

export function writeDataFile(data: Data): void {
  const dataPath = path.join(__dirname, "..", "data.json");
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  log("data.json updated");
}

export function getGuildGameSettings(guildId: string, game: SplashGames): SplashGameSettings {
  const data = getDataFile();
  return data.game_settings.find((g) => g.guild_id === guildId)?.[game] ?? defaultSplashGameSettings[game];
}

export function setGuildGameSettings(
  guildId: string,
  game: SplashGames,
  setting: keyof SplashGameSettings,
  value: any
): void {
  const data = getDataFile();

  if (!data.game_settings.find((g) => g.guild_id == guildId)) {
    data.game_settings.push({ guild_id: guildId, ...defaultSplashGameSettings });
  }

  const index = data.game_settings.findIndex((g) => g.guild_id == guildId);

  if (index == -1 || !data.game_settings[index][game]) {
    throw new Error(`Guild ${guildId} not found in data.json`);
  }

  data.game_settings[index][game] = {
    ...data.game_settings[index][game],
    [setting]: value,
  }

  writeDataFile(data);
}

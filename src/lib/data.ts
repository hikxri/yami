import path from "path";
import fs from "fs";
import { log } from "./log";

export type Data = {
  testing: boolean;
  greeting: boolean;
  test_users: string[];
  test_commands: string[];
  count: {
    guild_id: string;
    number: number;
  }[];
  game_settings: {
    guild_id: string;
    "arcaea-jacket"?: SplashGameSettings;
    "lol-skin"?: SplashGameSettings;
  }[];
};

export type SplashGames = "arcaea-jacket" | "lol-skin";

export type SplashGameSettings = {
  initial_size: number;
  size_increase: number;
  auto_hint: boolean;
  auto_hint_interval: number;
}

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

export function getGuildGameSettings(guildId: string, game: SplashGames): SplashGameSettings | undefined {
  const data = getDataFile();
  return data.game_settings.find((g) => g.guild_id == guildId)?.[game];
}
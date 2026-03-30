import type { EmbedBuilder } from "discord.js";
import type { ModifyImageSettings } from "../image";

export type SplashGames = "arcaea-jacket" | "lol-skin";
export type IconGames = "lol-ability" | "lol-item";
export type Games = SplashGames | IconGames;

export type GuildGameSettings = {
  guild_id: string;
} & Partial<Record<SplashGames, SplashGameSettings>>
  & Partial<Record<IconGames, IconGameSettings>>;

export type SplashGameSettings = {
  initial_size: number;
  size_increase: number;
  auto_hint: boolean;
  auto_hint_interval: number;
};

export type IconGameSettings = {
  auto_hint: boolean;
  auto_hint_interval: number;
  image_settings: ModifyImageSettings;
}

export type GameSettingsMap = {
  [G in SplashGames]: SplashGameSettings;
} & {
  [G in IconGames]: IconGameSettings;
};

export type AnswerCheckResult = "correct" | "partial" | "wrong";

type SplashGameAnswer = {
  gameImage: Buffer; // what is shown to the user
  originalImage: Buffer; // original image
  name: string; // answer
  left: number;
  top: number;
  width: number;
  height: number;
  checkAnswer(msg: string): AnswerCheckResult;
};

export interface SplashGameConfig {
  getAnswer(initialSize: number): Promise<SplashGameAnswer | null>;

  getHint(
    original: Buffer, // original image
    currentSize: number, // current size of resulting cropped image (not width/height)
    hintStep: number, // how many pixels to increase size by per hint
    left: number,
    top: number,
    width: number,
    height: number,
  ): Promise<{
    image: Buffer;
    left: number;
    top: number;
    width: number;
    height: number;
    size: number;
  }>;

  buildEmbed(uuid: string): EmbedBuilder;
}

type IconGameAnswer = {
  gameImage: Buffer; // what is shown to the user
  originalImage: Buffer; // original image
  name: string; // answer
  checkAnswer(msg: string): AnswerCheckResult;
};

export interface IconGameConfig {
  getAnswer(settings: IconGameSettings): Promise<IconGameAnswer | null>;
  getHint(name: string, hintCount: number): string;
  buildEmbed(uuid: string): EmbedBuilder;
}

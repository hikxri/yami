import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { SplashGameConfig } from "../lib/games/types";
import { getRandomSkin } from "../lib/lol/get";
import { filterName, getShorthandFile } from "../lib/lol/shorthand";
import { enlargeSplash } from "../lib/image";
import { getGuildGameSettings } from "../lib/data";
import { runSplashGame } from "../lib/games/splashGames";

export const data = new SlashCommandBuilder()
  .setName("lol-skin")
  .setDescription("guess the league of legends character from the skin");

const lolSkinConfig: SplashGameConfig = {
  async getAnswer(initialSize) {
    const res = await getRandomSkin(initialSize);
    if (!res) return null;
    const { champion, skin, set, originalSplash, splash, left, top, width, height } = res;
    const shorthand = getShorthandFile()[champion];

    function checkAnswer(msg: string) {
      const filtered = filterName(msg);
      if (filtered === filterName(champion.toLowerCase()) || shorthand.includes(filtered)) {
        return "correct";
      }
      if (filtered.includes(skin.toLowerCase()) || set.map((s) => s.toLowerCase()).includes(filtered)) {
        return "partial";
      }
      return "wrong";
    }

    return {
      gameImage: splash,
      originalImage: originalSplash,
      name: `\`${skin.toLowerCase() === "original" ? "" : skin + " "}${champion}\``,
      left: left,
      top: top,
      width: width,
      height: height,
      checkAnswer,
    };
  },

  async getHint(original, currentSize, hintStep, left, top, width, height) {
    const res = await enlargeSplash(original, hintStep, left, top, width, height, currentSize);
    return { image: res.result, left: res.left, top: res.top, width: res.width, height: res.height, size: res.size };
  },

  buildEmbed(uuid) {
    const embed = new EmbedBuilder()
      .setTitle("whose skin is this?")
      .setDescription(
        `
answer in this format: \`<champion name>\`
for example: \`Pyke\`

end the game prematurely with \`end\`

answer is case-insensitive
`,
      )
      .setImage("attachment://image.png")
      .setFooter({
        text: `game id: ${uuid}`,
      });

    return embed;
  },
};

export async function execute(interaction: ChatInputCommandInteraction) {
  const settings = getGuildGameSettings(interaction.guildId!, "lol-skin");
  await runSplashGame(interaction, "lol-skin", lolSkinConfig, settings);
}
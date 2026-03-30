import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { SplashGameConfig } from "../lib/games/types";
import { enlargeSplash } from "../lib/image";
import { getGuildGameSettings } from "../lib/data";
import { runSplashGame } from "../lib/games/splashGames";
import { getRandomSongJacket } from "../lib/arcaea/get";
import { filterName, getShorthandFile } from "../lib/arcaea/shorthand";

export const data = new SlashCommandBuilder()
  .setName("arcaea-jacket")
  .setDescription("guess the arcaea chart from the jacket");

const arcaeaJacketConfig: SplashGameConfig = {
  async getAnswer(initialSize) {
    const res = await getRandomSongJacket(initialSize);
    if (!res) return null;
    const { title, originalJacket, jacket, left, top, width, height } = res;
    const shorthand = getShorthandFile()[title] || [""];

    function checkAnswer(msg: string) {
      const filtered = filterName(msg);
      if (filtered === filterName(title.toLowerCase()) || shorthand.includes(filtered)) {
        return "correct";
      }
      if ((title.toLowerCase().includes(msg) || shorthand.includes(msg)) && msg !== "") {
        return "partial";
      }
      return "wrong";
    }

    return {
      gameImage: jacket,
      originalImage: originalJacket,
      name: title,
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
      .setTitle("which chart is this?")
      .setDescription(
        `
answer in this format: \`<song name>\`
for example: \`Testify\`

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
  const settings = getGuildGameSettings(interaction.guildId!, "arcaea-jacket");
  await runSplashGame(interaction, "arcaea-jacket", arcaeaJacketConfig, settings);
}

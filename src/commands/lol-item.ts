import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { IconGameConfig } from "../lib/games/types";
import { getRandomItem } from "../lib/lol/get";
import { modifyImage } from "../lib/image";
import { getGuildGameSettings } from "../lib/data";
import { runIconGame } from "../lib/games/iconGames";

export const data = new SlashCommandBuilder()
  .setName("lol-item")
  .setDescription("play 'guess the league of legends item'");

const lolItemConfig: IconGameConfig = {
  async getAnswer(settings) {
    const res = await getRandomItem();
    if (!res) return null;

    const { name, icon } = res;

    const modified = await modifyImage(icon, settings.image_settings);

    function checkAnswer(msg: string) {
      const filtered = msg.toLowerCase().trim().replace("’", "'");

      if (filtered === name.toLowerCase()) {
        return "correct";
      }
      if (msg.split(" ").some((word) => name.toLowerCase().includes(word))) {
        return "partial";
      }
      return "wrong";
    }

    return {
      gameImage: modified,
      originalImage: icon,
      name: name,
      checkAnswer,
    };
  },

  getHint(name, hintCount) {
    return (
      "hint: `" +
      name
        .split(" ")
        .map((word) =>
          word.slice(0, hintCount).concat(hintCount < word.length ? "_".repeat(word.length - hintCount) : ""),
        )
        .join(" ") +
      "`"
    );
  },

  buildEmbed(uuid) {
    const embed = new EmbedBuilder()
      .setTitle("what item is this?")
      .setDescription(
        `
answer in this format: \`<item name>\`
for example: \`Black Cleaver\`

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
  const settings = getGuildGameSettings(interaction.guildId!, "lol-item");
  await runIconGame(interaction, "lol-item", lolItemConfig, settings);
}

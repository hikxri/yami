import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { IconGameConfig } from "../lib/games/types";
import { getRandomAbility } from "../lib/lol/get";
import { modifyImage } from "../lib/image";
import { getGuildGameSettings } from "../lib/data";
import { runIconGame } from "../lib/games/iconGames";
import { filterName, getShorthandFile } from "../lib/lol/shorthand";

export const data = new SlashCommandBuilder()
  .setName("lol-ability")
  .setDescription("play 'guess the league of legends ability'");

const lolAbilityConfig: IconGameConfig = {
  async getAnswer(settings) {
    const res = await getRandomAbility();
    if (!res) return null;

    const { key, name, champion, icon } = res;

    const modified = await modifyImage(icon, settings.image_settings);

    const shorthand = getShorthandFile()[champion];
    const shorthandAnswers = shorthand.map((s) => `${s} ${key.toLowerCase()}`);

    function checkAnswer(msg: string) {
      const filtered = msg.toLowerCase().trim().replace("’", "'");

      if (
        filtered === `${filterName(champion)} ${key.toLowerCase()}` ||
        shorthandAnswers.includes(filtered) ||
        filtered === name.toLowerCase()
      ) {
        return "correct";
      }
      if (filtered.startsWith(champion.toLowerCase()) || shorthand.includes(filtered.split(" ")[0].toLowerCase())) {
        return "partial";
      }
      return "wrong";
    }

    return {
      gameImage: modified,
      originalImage: icon,
      name: `${champion} ${key} - ${name}`,
      checkAnswer,
    };
  },

  getHint(name, hintCount) {
    return (
      "hint: `" +
      name
        .split(" ")
        .map((word) => {
          const alnumCount = (word.match(/[a-z0-9]/gi) || []).length;

          // If <= 2 alphanumeric chars → hide all alphanumeric chars
          if (alnumCount <= 2) {
            return word.replace(/[a-z0-9]/gi, "_");
          }

          let revealed = 0;

          return word
            .split("")
            .map((char) => {
              if (!/[a-z0-9]/i.test(char)) {
                return char; // keep punctuation
              }

              if (revealed < hintCount) {
                revealed++;
                return char; // reveal
              }

              return "_"; // hide
            })
            .join("");
        })
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
  const settings = getGuildGameSettings(interaction.guildId!, "lol-ability");
  await runIconGame(interaction, "lol-ability", lolAbilityConfig, settings);
}

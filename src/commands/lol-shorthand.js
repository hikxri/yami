import { SlashCommandBuilder } from "discord.js";
import "dotenv/config";
import { getShorthandFile } from "../lib/lol/shorthand";

export const data = new SlashCommandBuilder()
  .setName("lol-shorthand")
  .setDescription(
    "view all shorthand writings for league of legends champion names",
  );

export async function execute(interaction) {
  const shorthand = Object.entries(getShorthandFile()).filter(
    ([, value]) => value.length,
  );

  await interaction.reply(
    shorthand
      .map(
        (entry) =>
          `**${entry[0]}**: ${entry[1].map((s) => `\`${s}\``).join(", ")}`,
      )
      .join("\n"),
  );
}

import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("hey")
  .setDescription("she says hey");

export async function execute(interaction) {
  await interaction.reply("hey");
}

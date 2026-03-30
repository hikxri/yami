import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("hey")
  .setDescription("she says hey");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply("hey");
}

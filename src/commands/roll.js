import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("roll")
  .setDescription("rolls a random number")
  .addIntegerOption((option) =>
    option
      .setName("limit")
      .setDescription("the limit of the roll")
      .setRequired(false),
  );

export async function execute(interaction) {
  const limit = interaction.options.getInteger("limit") || 100;
  const randomNumber = Math.ceil(Math.random() * limit);
  await interaction.reply(`<@${interaction.user.id}> rolled a ${randomNumber}!\n-# (out of ${limit})`);
}

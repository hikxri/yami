import { AutocompleteInteraction, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getReactionImage, getReactionList } from "../lib/react";

export const data = new SlashCommandBuilder()
  .setName("react")
  .setDescription("when you react")
  .addStringOption((option) =>
    option.setName("name").setDescription("what you react").setRequired(true).setAutocomplete(true),
  )
  .addUserOption((option) => option.setName("mention").setDescription("who you react").setRequired(false));


export async function autocomplete(interaction: AutocompleteInteraction) {
  const focus = interaction.options.getFocused(true);
  const text = focus.value.toLowerCase();

  const filtered = getReactionList().filter((reaction) => reaction.name.toLowerCase().includes(text));

  await interaction.respond(filtered);
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString("name");
  const user = interaction.options.getUser("mention");

  if (!name) {
    await interaction.reply({
      content: "invalid input! (name is required!)",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const image = getReactionImage(name);

  if (!image) {
    await interaction.reply({
      content: "reaction image not found!",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.reply({
    content: user ? `<@${user.id}>` : "",
    files: [image],
  });
}

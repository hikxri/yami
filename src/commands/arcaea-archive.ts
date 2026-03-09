import {
  AttachmentBuilder,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import sharp from "sharp";
import { songNames, songsData } from "../lib/arcaea/get";

export const data = new SlashCommandBuilder()
  .setName("arcaea-archive")
  .setDescription("get info about stuff in arcaea")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("chart")
      .setDescription("get info about a chart")
      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("chart title")
          .setAutocomplete(true)
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("difficulty")
          .setDescription("chart difficulty")
          .setAutocomplete(true)
          .setRequired(false),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("filter")
      .setDescription("get all charts matching a filter")
      .addNumberOption((option) =>
        option
          .setName("cc")
          .setDescription("chart constant")
          .setRequired(true),
      )
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const subcommand = interaction.options.getSubcommand();
  const focus = interaction.options.getFocused(true);
  const text = focus.value.toLowerCase();

  if (subcommand === "chart") {
    if (focus.name === "title") {
      let filtered = [];
      filtered = Object.entries(songNames).filter(([name, _]) =>
        name.toLowerCase().includes(text),
      );
      filtered = filtered.map(([name, url]) => ({ name: name, value: url }));
      filtered = filtered.slice(0, 25);

      await interaction.respond(filtered);
    }
    
    if (focus.name === "difficulty") {
      const chartTitle = interaction.options.getString("title", false);

      if (!chartTitle) {
        return await interaction.respond([]); 
      }

      const availableDiffs = Object.keys(songsData[chartTitle]);
      
      await interaction.respond(availableDiffs.map((diff) => ({ name: diff, value: diff })));
    }
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply("boop beep test");
}
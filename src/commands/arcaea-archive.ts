import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { songNames, songsData } from "../lib/arcaea/get";
import type { Difficulty } from "../lib/arcaea/types";
import { createChartAllEmbed, createChartDiffEmbed } from "../lib/archive/arcaea/chart";

export const data = new SlashCommandBuilder()
  .setName("arcaea-archive")
  .setDescription("get info about stuff in arcaea")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("chart")
      .setDescription("get info about a chart")
      .addStringOption((option) =>
        option.setName("title").setDescription("chart title").setAutocomplete(true).setRequired(true),
      )
      .addStringOption((option) =>
        option.setName("difficulty").setDescription("chart difficulty").setAutocomplete(true).setRequired(false),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("filter")
      .setDescription("get all charts matching a filter")
      .addNumberOption((option) => option.setName("cc").setDescription("chart constant").setRequired(true)),
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const subcommand = interaction.options.getSubcommand();
  const focus = interaction.options.getFocused(true);
  const text = focus.value.toLowerCase();

  if (subcommand === "chart") {
    if (focus.name === "title") {
      let filtered = [];
      filtered = Object.entries(songNames).filter(([name, _]) => name.toLowerCase().includes(text));
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
  await interaction.deferReply({ withResponse: true });
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === "chart") {
    const title = interaction.options.getString("title", true);
    const difficulty = interaction.options.getString("difficulty", false) as Difficulty | undefined;

    if (difficulty) {
      const { embed, jacket } = await createChartDiffEmbed(title, difficulty);

      const showMoreButton = new ButtonBuilder()
        .setCustomId(`arcaea-archive-chart-detailed&${title}&${difficulty}`)
        .setLabel("Show more")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(showMoreButton);

      await interaction.editReply({
        embeds: [embed],
        files: [jacket],
        components: [row],
      });

      return;
    }

    const { embed, jacket, alternateTitle, alternateJacket } = await createChartAllEmbed(title);

    const showMoreButton = new ButtonBuilder()
      .setCustomId(`arcaea-archive-chart-detailed&${title}`)
      .setLabel("Show more")
      .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(showMoreButton);

    if (alternateTitle && difficulty && difficulty !== "BYD") {
      const showAltTitleButton = new ButtonBuilder()
        .setCustomId(`arcaea-archive-chart&${title}&BYD`)
        .setLabel("Show BYD")
        .setStyle(ButtonStyle.Secondary);

      buttonRow.addComponents(showAltTitleButton);
    }

    if (alternateJacket && difficulty && difficulty !== "BYD") {
      const showAltJacketButton = new ButtonBuilder()
        .setCustomId(`arcaea-archive-jacket&${title}&BYD`)
        .setLabel("Show BYD jacket")
        .setStyle(ButtonStyle.Secondary);

      buttonRow.addComponents(showAltJacketButton);
    }

    const diffSelectorRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`arcaea-archive-chart-diff&${title}`)
        .setPlaceholder("All")
        .addOptions([
          { label: "All", value: "all" },
          ...Object.keys(songsData[title]).map((diff) => ({
            label: diff,
            value: diff,
          })),
        ]),
    );

    await interaction.editReply({
      embeds: [embed],
      files: [jacket],
      components: [diffSelectorRow, buttonRow],
    });

    return;
  }

  await interaction.editReply("boop beep test");
}

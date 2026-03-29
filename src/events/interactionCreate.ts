import { MessageFlags, Events, type Interaction, ChannelType, EmbedBuilder, AttachmentBuilder } from "discord.js";
import { getDataFile } from "../lib/data";
import { log, logError } from "../lib/log";
import { createChartAllEmbed, createChartDiffEmbed } from "../lib/archive/arcaea/chart";
import type { Difficulty } from "../lib/arcaea/types";
import { getSongJacket } from "../lib/arcaea/get";

export const name = Events.InteractionCreate;
export const on = true;

const cfg = getDataFile();
const { test_commands, test_users } = cfg;
test_users.push(process.env.OWNER_ID as string);

export async function execute(interaction: Interaction) {
  if (interaction.isChatInputCommand()) {
    log(`${interaction.user.username} - ${interaction.guild?.name || "Direct Message"}: ${interaction.commandName}`);

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      await interaction.reply({
        content: `command \`${interaction.commandName}\` not found!`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (
      test_commands.includes(interaction.commandName) &&
      global.testing &&
      !test_users.includes(interaction.user.id)
    ) {
      await interaction.reply({
        content: "this command is under testing, try again later!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logError(error);
      if (!interaction) {
        logError("No interaction was found.");
        return;
      }
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(`<@${process.env.OWNER_ID}> help`);
      } else {
        await interaction.reply(`<@${process.env.OWNER_ID}> help`);
      }
      return;
    }
  } else if (interaction.isAutocomplete()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logError(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      logError(error);
      if (interaction.channel?.type === ChannelType.GroupDM) return;
      await interaction.channel?.send(`<@${process.env.OWNER_ID}> help\n-# interaction type: ${interaction.type}`);
      return;
    }
  } else if (interaction.isButton()) {
    log(
      `${interaction.user.username} - ${
        interaction.guild?.name || "Direct Message"
      }: Button clicked: ${interaction.customId}`,
    );

    await interaction.deferUpdate();
    const args = interaction.customId.split("&");

    if (args[0] === "arcaea-archive-chart") {
      const title = args[1];
      const difficulty = args[2] as Difficulty;

      const { embed, jacket } = await createChartDiffEmbed(title, difficulty, false);

      await interaction.editReply({
        embeds: [embed],
        files: [jacket],
      });
    }

    if (args[0] === "arcaea-archive-chart-detailed") {
      const title = args[1];
      const difficulty = args[2] as Difficulty;

      const { embed, jacket } = difficulty
        ? await createChartDiffEmbed(title, difficulty, true)
        : await createChartAllEmbed(title, true);

      await interaction.editReply({
        embeds: [embed],
        files: [jacket],
      });
    }

    if (args[0] === "arcaea-archive-jacket") {
      const title = args[1];
      const difficulty = args[2] as Difficulty;

      const jacket = await getSongJacket(title, difficulty);
      const file = new AttachmentBuilder(jacket, { name: "edited-image.png" });

      const embed = interaction.message.embeds[0];

      const updatedEmbed = EmbedBuilder.from(embed).setThumbnail(`attachment://edited-image.png`);

      await interaction.editReply({
        embeds: [updatedEmbed],
        files: [file],
      });
    }
  } else if (interaction.isStringSelectMenu()) {
    log(
      `${interaction.user.username} - ${
        interaction.guild?.name || "Direct Message"
      }: Select menu clicked: ${interaction.customId}`,
    );

    await interaction.deferUpdate();
    const args = interaction.customId.split("&");

    if (args[0] === "arcaea-archive-chart-diff") {
      const title = args[1];
      const values = interaction.values;
      const difficulty = values[0] === "all" ? null : (values[0] as Difficulty);

      const { embed, jacket } = difficulty
        ? await createChartDiffEmbed(title, difficulty, false)
        : await createChartAllEmbed(title, false);

      await interaction.editReply({
        embeds: [embed],
        files: [jacket],
      });
    }
  }
  return;
}

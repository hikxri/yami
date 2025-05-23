import { MessageFlags, Events } from "discord.js";
import { getDataFile } from "../lib/data";
import { log, logError } from "../lib/log";

export const name = Events.InteractionCreate;
export const on = true;

const cfg = getDataFile();
const { test_commands, test_users } = cfg;
test_users.push(process.env.OWNER_ID);

export async function execute(interaction) {
  if (interaction.isChatInputCommand()) {
    log(
      `${interaction.user.username} - ${
        interaction.guild?.name || "Direct Message"
      }: ${interaction.commandName}`,
    );

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
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
      logError(
        `No command matching ${interaction.commandName} was found.`,
      );
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      logError(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(
          `<@${process.env.OWNER_ID}> help\n-# interaction type: ${interaction.type}`,
        );
      } else if (interaction.type === 3) {
        // message component
        await interaction.reply(
          `<@${process.env.OWNER_ID}> help\n-# interaction type: ${interaction.type}`,
        );
      } else {
        await interaction.channel.send(
          `<@${process.env.OWNER_ID}> help\n-# interaction type: ${interaction.type}`,
        );
      }
      return;
    }
  }
  return;
}

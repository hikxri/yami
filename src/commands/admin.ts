import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction, PartialGroupDMChannel } from "discord.js";
import { getDataFile, writeDataFile, type Data } from "../lib/data";

export const data = new SlashCommandBuilder()
  .setName("admin")
  .setDescription("hikari only")
  .addStringOption((option) => option.setName("command").setDescription("command name").setRequired(true))
  .addStringOption((option) => option.setName("args").setDescription("arguments"));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (interaction.user.id !== process.env.OWNER_ID) {
    await interaction.reply({
      content: "you don't have permission to use this command!",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const command = interaction.options.getString("command");
  const args = interaction.options.getString("args");

  if (command === "testing" && args) {
    const value = args.toLowerCase() === "true" ? true : false;
    setData("testing", value);
    global.testing = value;
    await interaction.reply(`\`testing\` is set to  \`${value}\``);
    return;
  }
  if (command === "greeting" && args) {
    const value = args.toLowerCase() === "true" ? true : false;
    setData("greeting", value);
    global.greeting = value;
    await interaction.reply(`\`greeting\` is set to  \`${value}\``);
    return;
  }
  if (command === "reset") {
    if (!interaction.channel) {
      await interaction.reply({
        content: "this command can only be used in a channel!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    global.gameOngoing[interaction.channel.id] = false;
    await interaction.reply(`\`gameOngoing\` of <#${interaction.channel.id}> is resetted to \`false\``);
    return;
  }
  if (command === "say" && args) {
    const [channel, message] = args.split(/ (.*)/s);
    const client = interaction.client;

    const c = await client.channels.fetch(channel);

    if (c?.isSendable()) {
      await c.send(message);
    } else {
      await interaction.reply({
        content: "channel is not sendable",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      content: `message sent to <#${channel}>`,
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.reply({
    content: "hikari what the fuck are you doing",
    flags: MessageFlags.Ephemeral,
  });
}

function setData(key: keyof Data, value: any): void {
  const cfg = getDataFile();
  cfg[key] = value;
  writeDataFile(cfg);
}

import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { getDataFile, writeDataFile } from "../lib/data";

export const data = new SlashCommandBuilder()
  .setName("admin")
  .setDescription("hikari only")
  .addStringOption((option) =>
    option
      .setName("command")
      .setDescription("command name")
      .setRequired(true),
  ).addStringOption((option) =>
    option
      .setName("args")
      .setDescription("arguments"),
  );

export async function execute(interaction) {
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
    global.gameOngoing[interaction.channel.id] = false;
    await interaction.reply(`\`gameOngoing\` of <#${interaction.channel.id}> is resetted to \`false\``);
    return;
  }
  if (command === "say" && args) {
    const [channel, message] = args.split(/ (.*)/s);
    const client = interaction.client;
    client.channels
    .fetch(channel)
    .then((c) => c.send(message));
  }

  await interaction.reply({
    content: "hikari what the fuck are you doing",
    flags: MessageFlags.Ephemeral,
  });
}

function setData(key, value) {
  const cfg = getDataFile();
  cfg[key] = value;
  writeDataFile(cfg);
}
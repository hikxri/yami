import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getDataFile, writeDataFile } from "../lib/data";
import { log } from "../lib/log";

function getCount(guild_id: string): { guild_id: string; number: number } {
  const data = getDataFile();
  const guild = data.count.find((g) => g.guild_id == guild_id);
  if (guild) {
    return guild;
  } else {
    registerGuild(guild_id);
    return { guild_id: guild_id, number: 0 };
  }
}

function writeCount(guild_id: string, number: number): void {
  const data = getDataFile();
  data.count[data.count.findIndex((g) => g.guild_id == guild_id)].number = number;
  writeDataFile(data);
}

function registerGuild(guild_id: string): void {
  const data = getDataFile();

  data.count.push({ guild_id: guild_id, number: 0 });

  writeDataFile(data);
}

export const data = new SlashCommandBuilder().setName("count").setDescription("increment The Number™");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId || !interaction.guild) {
    await interaction.reply({
      content: "this command can only be used in a server!",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  
  const count = getCount(interaction.guildId);
  log(`count of ${interaction.guild.name}: ${count.number} → ${count.number + 1} by ${interaction.user.username}`);

  count.number++;

  writeCount(interaction.guildId, count.number);

  await interaction.reply(`<@${interaction.user.id}> incremented The Number™, it is now ${count.number}.`);
}

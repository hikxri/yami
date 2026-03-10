import {
  AttachmentBuilder,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { getSongJacket, songNames, songsData } from "../lib/arcaea/get";
import type { Difficulty } from "../lib/arcaea/types";
import sharp from "sharp";

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
  await interaction.deferReply();
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === "chart") {
    const title = interaction.options.getString("title", true);
    const difficulty = (interaction.options.getString("difficulty", false) || "FTR") as Difficulty;

    const { embed, jacket } = await createChartEmbed(title, difficulty);
    return await interaction.editReply({ embeds: [embed], files: [jacket] });
  }

  await interaction.editReply("boop beep test");
}

type ChartEmbed = {
  embed: EmbedBuilder;
  jacket: AttachmentBuilder;
}

async function createChartEmbed(id: string, difficulty: Difficulty): Promise<ChartEmbed> {
  const songInfo = songsData[id][difficulty];
  const jacket = await getSongJacket(id, difficulty);

  if (!songInfo) throw new Error(`Song: ${id} | ${difficulty} not found in data!`);

  const { title, artist, pack, level, cc, notes, background, designer, bpm, side, illustrator, length, date, vocals, url } = songInfo;
  const file = new AttachmentBuilder(
    await sharp(jacket).resize(128, 128).toBuffer(),
    { name: "image.png" },
  );

  const formattedDate = date.replace(/(?<=.)(?=Version)/g, '\n');

  const embed = new EmbedBuilder()
    .setAuthor({
      name: pack,
    })
    .setTitle(`(${difficulty}) ${title}`)
    // .setURL("https://arcaea.fandom.com/wiki/" + url)
    .setDescription(
      `**${artist}**
      (Vocals: ${vocals})
      
      ${formattedDate}
      `)
    .addFields(
      {
        name: "Level",
        value: level,
        inline: true
      },
      {
        name: "Chart constant",
        value: cc,
        inline: true
      },
      {
        name: "Note count",
        value: notes,
        inline: true
      },
      {
        name: "Chart design",
        value: designer,
        inline: true
      },
      {
        name: "Artwork",
        value: illustrator,
        inline: true
      },
      {
        name: "BPM",
        value: bpm,
        inline: true
      },
      {
        name: "Background",
        value: background,
        inline: true
      },
      {
        name: "Side",
        value: side,
        inline: true
      },
      {
        name: "Length",
        value: length,
        inline: true
      },
    )
    .setThumbnail("attachment://image.png")
    .setFooter({
      text: "Source: https://arcaea.fandom.com/wiki/" + url,
    });

  return { embed, jacket: file };
}
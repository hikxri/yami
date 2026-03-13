import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import type { Difficulty, SongRow } from "../../arcaea/types";
import { getSongJacket, songsData } from "../../arcaea/get";
import sharp from "sharp";

type ChartEmbed = {
  embed: EmbedBuilder;
  jacket: AttachmentBuilder;
};

export async function createChartDiffEmbed(
  id: string,
  difficulty: Difficulty,
  detailed: boolean = false,
): Promise<ChartEmbed> {
  const songInfo = songsData[id][difficulty];
  const jacket = await getSongJacket(id, difficulty);

  if (!songInfo) throw new Error(`Song: ${id} | ${difficulty} not found in data!`);

  const {
    title,
    artist,
    pack,
    level,
    cc,
    notes,
    background,
    designer,
    bpm,
    side,
    illustrator,
    length,
    date,
    vocals,
    url,
  } = songInfo;
  const file = new AttachmentBuilder(await sharp(jacket).resize(128, 128).toBuffer(), { name: "image.png" });

  const formattedDate = date.replace(/(?<=.)(?=Version)/g, "\n");

  const embed = new EmbedBuilder()
    .setAuthor({
      name: pack,
    })
    .setTitle(`(${difficulty}) ${title}`)
    .setDescription(
      `**${artist}**
      (Vocals: ${vocals})
      
      ${formattedDate}
      `,
    )
    .addFields(
      {
        name: "Level",
        value: level,
        inline: true,
      },
      {
        name: "Chart constant",
        value: cc,
        inline: true,
      },
      {
        name: "Note count",
        value: notes,
        inline: true,
      },
      ...(detailed
        ? [
            {
              name: "Chart design",
              value: designer,
              inline: true,
            },
            {
              name: "Artwork",
              value: illustrator,
              inline: true,
            },
            {
              name: "BPM",
              value: bpm,
              inline: true,
            },
            {
              name: "Background",
              value: background,
              inline: true,
            },
            {
              name: "Side",
              value: side,
              inline: true,
            },
            {
              name: "Length",
              value: length,
              inline: true,
            },
          ]
        : []),
    )
    .setThumbnail("attachment://image.png")
    .setFooter({
      text: "Source: https://arcaea.fandom.com/wiki/" + url,
    });

  return { embed, jacket: file };
}

type TransposedSongRow = {
  [K in keyof SongRow]: Record<Difficulty, string>
};
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import type { Difficulty, SongRow } from "../../arcaea/types";
import { getSongJacket, songsData } from "../../arcaea/get";

type ChartEmbed = {
  embed: EmbedBuilder;
  jacket: AttachmentBuilder;
  alternateTitle?: boolean; // has different song details on BYD (title, artist, etc.)
  alternateJacket?: boolean; // has different song jacket on BYD
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
  const file = new AttachmentBuilder(jacket, { name: "image.png" });

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
      field("Level", level),
      field("Chart constant", cc),
      field("Note count", notes),
      ...(detailed
        ? [
            field("Chart design", designer),
            field("Artwork", illustrator),
            field("BPM", bpm),
            field("Background", background),
            field("Side", side),
            field("Length", length),
          ]
        : []),
    )
    .setThumbnail("attachment://image.png")
    .setFooter({
      text: "Source: https://arcaea.fandom.com/wiki/" + url,
    });

  return { embed, jacket: file };
}

export async function createChartAllEmbed(id: string, detailed: boolean = false): Promise<ChartEmbed> {
  const songInfo = songsData[id];
  const jacket = await getSongJacket(id, "FTR" as Difficulty);

  if (!songInfo) throw new Error(`Song: ${id} not found in data!`);

  const difficulties = Object.keys(songInfo) as Difficulty[];

  // check for alternate versions
  const alternateTitle = songInfo.BYD && songInfo.BYD.title !== songInfo.FTR.title;
  const alternateJacket = songInfo.BYD && songInfo.BYD.jacket !== songInfo.FTR.jacket;

  const file = new AttachmentBuilder(jacket, { name: "image.png" });

  const { pack, title, artist, vocals, illustrator, bpm, background, side, length, url } = songInfo.FTR;

  const mapDiff = (key: keyof SongRow, separator = "/") =>
    difficulties.map((diff) => songInfo[diff][key]).join(separator);

  const date = songInfo.FTR.date.replace(/(?<=.)(?=Version)/g, "\n");
  const bydDate = songInfo.BYD ? songInfo.BYD.date.replace(/(?<=.)(?=Version)/g, "\n") : "";

  const embed = new EmbedBuilder()
    .setAuthor({
      name: pack,
    })
    .setTitle(`${title}`)
    .setDescription(
      `**${artist}**
      (Vocals: ${vocals})
      
      ${date}
      ${bydDate === date ? "" : bydDate}
      `,
    )
    .addFields(
      field("Difficulties", difficulties.join("/"), false),
      field("Levels", mapDiff("level")),
      field("Chart constants", mapDiff("cc")),
      field("Note counts", mapDiff("notes")),
      ...(detailed
        ? [
            field("Chart designs", mapDiff("designer")),
            field("Artwork", illustrator),
            field("BPM", bpm),
            field("Background", background),
            field("Side", side),
            field("Length", length),
          ]
        : []),
    )
    .setThumbnail("attachment://image.png")
    .setFooter({
      text: "Source: https://arcaea.fandom.com/wiki/" + url,
    });

  return { embed, jacket: file, alternateJacket, alternateTitle };
}

// helper function to create embed fields
function field(name: string, value: string, inline: boolean = true) {
  return {
    name: name,
    value: value,
    inline: inline,
  };
}

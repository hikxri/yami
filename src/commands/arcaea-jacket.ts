import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  Embed,
  EmbedBuilder,
  Message,
  MessageFlags,
  PartialGroupDMChannel,
  SlashCommandBuilder,
  User,
} from "discord.js";
import "dotenv/config";
import { log, logError } from "../lib/log";
import { v4 as uuidv4 } from "uuid";
import { filterName, getShorthandFile } from "../lib/arcaea/shorthand";
import { enlargeSplash } from "../lib/image";
import { getRandomSongJacket } from "../lib/arcaea/get";

export const data = new SlashCommandBuilder()
  .setName("arcaea-jacket")
  .setDescription("guess the arcaea chart from the jacket");

const AUTO_HINT = true;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.channel) return;
  if (interaction.channel instanceof PartialGroupDMChannel) return; // apparently you can't use collectors in "Partial Group DMs", whatever that is

  const channelId = interaction.channel!.id;

  if (global.gameOngoing[channelId]) {
    await interaction.reply({
      content: "a game is already ongoing in this channel",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const uuid = uuidv4();
  log(`arcaea-jacket game started: ${uuid}`);
  global.gameOngoing[channelId] = true;

  await interaction.deferReply();

  let res;
  try {
    res = await getData(uuid);
  } catch (e) {
    logError(e);
    global.gameOngoing[channelId] = false;
    await interaction.editReply("oops, try executing the command again.");
    return;
  }
  if (!res) {
    logError("Something went wrong when getting data.");
    global.gameOngoing[channelId] = false;
    await interaction.editReply("oops, try executing the command again.");
    return;
  }
  const { origFile, embed, answer, jacket } = res;
  let file = res.file;
  await interaction.editReply({ embeds: [embed], files: [file] });
  let winner: User | null = null;
  let answerCount = 0;

  const shorthand = getShorthandFile()[answer.title] || [""];

  const collectorFilter = (m: Message) => m.author.id !== process.env.CLIENT_ID;
  const collector = interaction.channel.createMessageCollector({
    filter: collectorFilter,
    max: 50,
  });

  collector.on("collect", async (message: Message) => {
    try {
      const msg = filterName(message.content);
      // console.log(message.content, msg);

      if (msg === "end") {
        collector.stop("manual end");
      } else if (msg === filterName(answer.title.toLowerCase()) || (shorthand.includes(msg) && msg !== "")) {
        message.react("✅");
        winner = message.author;
        collector.stop("correct answer");
      } else if ((answer.title.toLowerCase().includes(msg) || shorthand.includes(msg)) && msg !== "") {
        answerCount++;
        message.react("🟨");
      } else if (msg.startsWith("maxhint") && message.author.id === process.env.OWNER_ID) {
        file = origFile;
        await message.reply({ files: [file] });
      } else if (msg.includes("hint") && msg.startsWith("hint")) {
        // const hintCount = (msg.match(new RegExp("hint", "g")) || []).length;
        await replyWithHint(1);
      } else if (msg === "again") {
        await message.reply({ files: [file] });
      } else {
        answerCount++;
        if (AUTO_HINT && (answerCount - 1) % 3 === 0 && answerCount > 2) {
          await replyWithHint(1);
        }
        message.react("❌");
      }

      async function replyWithHint(hintCount: number) {
        const [result, temp] = await getHintFile(jacket, hintCount);
        Object.assign(jacket, temp);

        file = new AttachmentBuilder(result, { name: "image.png" });
        await message.reply({ files: [file] });
      }
    } catch (error) {
      logError(error);
      global.gameOngoing[channelId] = false;
      collector.stop("error");
      await message.reply(`<@${process.env.OWNER_ID}> help`);
    }
  });

  const answerText = answer.title;

  log(`${answerText} - ${uuid}`);

  collector.on("end", async () => {
    log(`arcaea-jacket game ended: ${uuid}`);
    global.gameOngoing[channelId] = false;
    if (!interaction.channel || interaction.channel instanceof PartialGroupDMChannel) return;
    if (collector.endReason === "limit") {
      await interaction.channel.send({
        content: `no one got the correct answer! the answer was: ${answerText}\n-# game id: ${uuid}`,
        files: [origFile],
      });
      return;
    }
    if (collector.endReason === "manual end") {
      await interaction.channel.send({
        content: `game ended. the answer was: ${answerText}\n-# game id: ${uuid}`,
        files: [origFile],
      });
      return;
    }
    if (collector.endReason === "correct answer") {
      if (!winner) {
        await interaction.channel.send("...no one won? hikari fix your bot");
        return;
      }
      await interaction.channel.send({
        content: `<@${winner.id}> won! the answer was: ${answerText}\n-# game id: ${uuid}`,
        files: [origFile],
      });
      return;
    }
  });
}

async function getHintFile(splash: Jacket, hintCount: number): Promise<[Buffer, Jacket]> {
  const { result, left, top, width, height, size } = await enlargeSplash(
    splash.original,
    // 32 * hintCount,
    16 * hintCount,
    splash.left,
    splash.top,
    splash.width,
    splash.height,
    128
  );
  return [result, { left: left, top: top, width: width, height: height, size: size } as Jacket];
}

type Data = {
  file: AttachmentBuilder;
  origFile: AttachmentBuilder;
  embed: EmbedBuilder;
  answer: {
    title: string;
  };
  jacket: Jacket;
};

type Jacket = {
  original: Buffer;
  left: number;
  top: number;
  width: number;
  height: number;
  size: number;
};

async function getData(uuid: string): Promise<Data | null> {
  const res = await getRandomSongJacket(64);
  if (!res) return null;
  const { jacket, title, originalJacket, left, top, width, height } = res;

  const file = new AttachmentBuilder(jacket, { name: "image.png" });
  const origFile = new AttachmentBuilder(originalJacket, {
    name: "original_image.png",
  });

  const embed = new EmbedBuilder()
    .setTitle("which chart is this?")
    .setDescription(
      `
        answer in this format: \`<song name>\`
        for example: \`Testify\`

        end the game prematurely with \`end\`

        answer is case-insensitive
        `
    )
    .setImage("attachment://image.png")
    .setFooter({
      text: `game id: ${uuid}`,
    });

  return {
    file: file,
    origFile: origFile,
    embed: embed,
    answer: {
      title: title,
    },
    jacket: {
      original: originalJacket,
      left: left,
      top: top,
      width: width,
      height: height,
      size: 128,
    },
  };
}

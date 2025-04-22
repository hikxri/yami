import {
  AttachmentBuilder,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import "dotenv/config";
import { enlargeSplash, getRandomSkin } from "../lib/lol/get";
import { filterName, getShorthandFile } from "../lib/lol/shorthand";
import { log, logError } from "../lib/log";
import { v4 as uuidv4 } from "uuid";

export const data = new SlashCommandBuilder()
  .setName("lol-skin")
  .setDescription("guess the league of legends character from the skin");

// temporary
const AUTO_HINT = true;

export async function execute(interaction) {
  if (global.gameOngoing[interaction.channel.id]) {
    await interaction.reply({
      content: "a game is already ongoing in this channel",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const uuid = uuidv4();
  log(`lol-skin game started: ${uuid}`);
  global.gameOngoing[interaction.channel.id] = true;

  await interaction.deferReply();

  let res;
  try {
    res = await getData(uuid);
  } catch (e) {
    logError(e);
    global.gameOngoing[interaction.channel.id] = false;
    await interaction.editReply("oops, try executing the command again.");
    return;
  }
  if (!res) {
    logError(e);
    global.gameOngoing[interaction.channel.id] = false;
    await interaction.editReply("oops, try executing the command again.");
    return;
  }
  const { origFile, embed, answer, splash } = res;
  let file = res.file;
  await interaction.editReply({ embeds: [embed], files: [file] });
  let winner = null;
  let answerCount = 0;

  const shorthand = getShorthandFile()[answer.name];

  const collectorFilter = (m) => m.author.id !== process.env.CLIENT_ID;
  const collector = interaction.channel.createMessageCollector({
    filter: collectorFilter,
    max: 50,
  });

  collector.on("collect", async (message) => {
    try {
      const msg = filterName(message.content);

      if (msg === "end") {
        collector.stop("manual end");
      } else if (
        msg === filterName(answer.name.toLowerCase()) ||
        shorthand.includes(msg)
      ) {
        message.react("✅");
        winner = message.author;
        collector.stop("correct answer");
      } else if (
        msg.includes(answer.skin.toLowerCase()) ||
        answer.set.map((s) => s.toLowerCase()).includes(msg.toLowerCase())
      ) {
        answerCount++;
        message.react("🟨");
      } else if (msg.startsWith("maxhint")) {
        file = origFile;
        await message.reply({ files: [file] });
      } else if (msg.includes("hint") && msg.startsWith("hint")) {
        const hintCount = (msg.match(new RegExp("hint", "g")) || []).length;
        await replyWithHint(hintCount);
      } else if (msg === "again") {
        await message.reply({ files: [file] });
      } else {
        answerCount++;
        if (AUTO_HINT && (answerCount - 1) % 2 === 0 && answerCount > 2) {
          await replyWithHint(1);
        }
        message.react("❌");
      }

      async function replyWithHint(hintCount) {
        const [result, temp] = await getHintFile(splash, hintCount);
        Object.assign(splash, temp);

        file = new AttachmentBuilder(result, { name: "image.png" });
        await message.reply({ files: [file] });
      }
    } catch (error) {
      logError(error);
      global.gameOngoing[interaction.channel.id] = false;
      collector.stop("error");
      await message.reply(`<@${process.env.OWNER_ID}> help`);
    }
  });

  const answerText = `\`${
    answer.skin.toLowerCase() === "original" ? "" : answer.skin + " "
  }${answer.name}\``;

  log(`${answerText} - ${uuid}`);

  collector.on("end", async () => {
    log(`lol-skin game ended: ${uuid}`);
    global.gameOngoing[interaction.channel.id] = false;
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
      await interaction.channel.send({
        content: `<@${winner.id}> won! the answer was: ${answerText}\n-# game id: ${uuid}`,
        files: [origFile],
      });
      return;
    }
  });
}

async function getHintFile(splash, hintCount) {
  const { result, left, top, width, height, size } = await enlargeSplash(
    splash.original,
    32 * hintCount,
    splash.left,
    splash.top,
    splash.width,
    splash.height,
    splash.size,
  );
  return [
    result,
    { left: left, top: top, width: width, height: height, size: size },
  ];
}

async function getData(uuid) {
  const res = await getRandomSkin();
  if (!res) return null;
  const {
    champion,
    skin,
    set,
    originalSplash,
    splash,
    left,
    top,
    width,
    height,
  } = res;

  const file = new AttachmentBuilder(splash, { name: "image.png" });
  const origFile = new AttachmentBuilder(originalSplash, {
    name: "original_image.png",
  });

  const embed = new EmbedBuilder()
    .setTitle("whose skin is this?")
    .setDescription(
      `
        answer in this format: \`<champion name>\`
        for example: \`Pyke\`

        end the game prematurely with \`end\`

        answer is case-insensitive
        `,
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
      name: champion,
      set: set,
      skin: skin,
    },
    splash: {
      original: originalSplash,
      left: left,
      top: top,
      width: width,
      height: height,
      size: 128,
    },
  };
}

import {
  AttachmentBuilder,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import "dotenv/config";
import { enlargeSplash, getRandomSkin } from "../lib/lol/get";
import { filterName, getShorthandFile } from "../lib/lol/shorthand";

export const data = new SlashCommandBuilder()
  .setName("lol-skin")
  .setDescription("guess the league of legends character from the skin");

export async function execute(interaction) {
  if (global.gameOngoing[interaction.channel.id]) {
    await interaction.reply({
      content: "a game is already ongoing in this channel",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  global.gameOngoing[interaction.channel.id] = true;

  await interaction.deferReply();

  let res;
  try {
    res = await getData();
  } catch (e) {
    console.error(e);
    global.gameOngoing[interaction.channel.id] = false;
    await interaction.editReply("oops, try executing the command again.");
    return;
  }
  if (!res) {
    console.error(e);
    global.gameOngoing[interaction.channel.id] = false;
    await interaction.editReply("oops, try executing the command again.");
    return;
  }
  const { origFile, embed, answer, splash } = res;
  let file = res.file;
  await interaction.editReply({ embeds: [embed], files: [file] });
  let winner = null;

  console.log(answer);

  const shorthand = getShorthandFile()[answer.name];

  const collectorFilter = (m) => m.author.id !== process.env.CLIENT_ID;
  const collector = interaction.channel.createMessageCollector({
    filter: collectorFilter,
    max: 50,
  });

  collector.on("collect", async (message) => {
    try {
      console.log(`Collected message: ${message.content}`);
      const msg = filterName(message.content);

      if (msg === "end") {
        collector.stop("manual end");
      }
      if (
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
        message.react("🟨");
      } else if (msg.startsWith("maxhint")) {
        file = origFile;
        await message.reply({ files: [file] });
      } else if (msg.includes("hint") && msg.startsWith("hint")) {
        const hintCount = (msg.match(new RegExp("hint", "g")) || []).length;
        const [result, temp] = await getHintFile(splash, hintCount);
        Object.assign(splash, temp);

        file = new AttachmentBuilder(result, { name: "image.png" });
        await message.reply({ files: [file] });
      } else if (msg === "again") {
        await message.reply({ files: [file] });
      } else {
        message.react("❌");
      }
    } catch (error) {
      console.error(error);
      global.gameOngoing[interaction.channel.id] = false;
      collector.stop("error");
      await message.reply(`<@${process.env.OWNER_ID}> help`);
    }
  });

  const answerText = `\`${
    answer.skin.toLowerCase() === "original" ? "" : answer.skin + " "
  }${answer.name}\``;

  collector.on("end", async (collected) => {
    console.log(`Collected ${collected.size} items`);
    global.gameOngoing[interaction.channel.id] = false;
    if (collector.endReason === "limit") {
      await interaction.channel.send({
        content: `no one got the correct answer! the answer was: ${answerText}`,
        files: [origFile],
      });
      return;
    }
    if (collector.endReason === "manual end") {
      await interaction.channel.send({
        content: `game ended. the answer was: ${answerText}`,
        files: [origFile],
      });
      return;
    }
    if (collector.endReason === "correct answer") {
      await interaction.channel.send({
        content: `<@${winner.id}> won! the answer was: ${answerText}`,
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

async function getData() {
  const startTime = performance.now();
  const res = await getRandomSkin();
  const endTime = performance.now();
  const duration = endTime - startTime;
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
      text: `i'm still testing this --hikari\ntime taken: ${(
        duration / 1000
      ).toFixed(2)}s`,
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

import { AttachmentBuilder, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRandomItem } from "../lib/lol/get";
import "dotenv/config";
import { log, logError } from "../lib/log";
import { v4 as uuidv4 } from "uuid";

export const data = new SlashCommandBuilder().setName("lol-item").setDescription("play 'guess the league of legends item'");

export async function execute(interaction) {
  if (global.gameOngoing[interaction.channel.id]) {
    await interaction.reply({
      content: "a game is already ongoing in this channel",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const uuid = uuidv4();
  log(`lol-item game started: ${uuid}`);
  global.gameOngoing[interaction.channel.id] = true;

  await interaction.deferReply();

  const res = await getData(uuid);
  if (!res) await interaction.editReply("oops, try executing the command again.");
  const { origFile, file, embed, answer } = res;
  await interaction.editReply({ embeds: [embed], files: [file] });
  let winner = null;
  let hintCount = 0;

  const collectorFilter = (m) => m.author.id !== process.env.CLIENT_ID;
  const collector = interaction.channel.createMessageCollector({
    filter: collectorFilter,
    max: 50,
  });

  collector.on("collect", async (message) => {
    try {
      const msg = message.content.toLowerCase().trim().replace("’", "'");
      if (msg === "end") {
        collector.stop("manual end");
      } else if (msg === answer.name.toLowerCase()) {
        message.react("✅");
        winner = message.author;
        collector.stop("correct answer");
      } else if (msg.split(" ").some((word) => answer.name.toLowerCase().includes(word))) {
        message.react("🟨");
      } else if (msg.includes("hint") && msg.startsWith("hint")) {
        hintCount = hintCount + (msg.match(new RegExp("hint", "g")) || []).length;
        await message.reply(
          "hint: `" +
            answer.name
              .split(" ")
              .map((word) => word.slice(0, hintCount).concat(hintCount < word.length ? "_".repeat(word.length - hintCount) : ""))
              .join(" ") +
            "`",
        );
      } else if (msg === "again") {
        await message.reply({ files: [file] });
      } else {
        message.react("❌");
      }
    } catch (error) {
      logError(error);
      global.gameOngoing[interaction.channel.id] = false;
      await message.reply(`<@${process.env.OWNER_ID}> help`);
    }
  });

  log(`${answer.name} - ${uuid}`);

  collector.on("end", async () => {
    log(`lol-item game ended: ${uuid}`);
    global.gameOngoing[interaction.channel.id] = false;
    if (collector.endReason === "limit") {
      await interaction.channel.send({
        content: `no one got the correct answer! the answer was: \`${answer.name}\``,
        files: [origFile],
      });
      return;
    }
    if (collector.endReason === "manual end") {
      await interaction.channel.send({
        content: `game ended. the answer was: \`${answer.name}\``,
        files: [origFile],
      });
      return;
    }
    if (collector.endReason === "correct answer") {
      await interaction.channel.send({
        content: `<@${winner.id}> won! the answer was: \`${answer.name}\``,
        files: [origFile],
      });
      return;
    }
  });
}

async function getData(uuid) {
  const res = await getRandomItem();
  if (!res) return null;
  const { name, icon, originalIcon } = res;

  const file = new AttachmentBuilder(icon, { name: "image.png" });
  const origFile = new AttachmentBuilder(originalIcon, {
    name: "original_image.png",
  });

  const embed = new EmbedBuilder()
    .setTitle("what item is this?")
    .setDescription(
      `
        answer in this format: \`<item name>\`
        for example: \`Black Cleaver\`

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
      name: name,
    },
  };
}

import { AttachmentBuilder, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRandomAbility } from "../lib/lol/get";
import "dotenv/config";
import { filterName, getShorthandFile } from "../lib/lol/shorthand";

export const data = new SlashCommandBuilder()
  .setName("lol-ability")
  .setDescription("play 'guess the league of legends ability'");

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

  const res = await getData();

  if (!res) await interaction.editReply("oops, try executing the command again.");
  const { origFile, file, embed, answer } = res;
  await interaction.editReply({ embeds: [embed], files: [file] });
  let winner = null;
  let hintCount = 0;

  const shorthand = getShorthandFile()[answer.champion];

  console.log(answer);

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
      } else if (
        msg === `${filterName(answer.champion)} ${answer.key.toLowerCase()}` ||
        msg === `${shorthand.includes(msg)} ${answer.key.toLowerCase()}` ||
        msg === answer.name.toLowerCase()
      ) {
        message.react("✅");
        winner = message.author;
        collector.stop("correct answer");
      } else if (msg.startsWith(answer.champion.toLowerCase()) || shorthand.includes(msg.split(" ")[0].toLowerCase())) {
        message.react("🟨");
      } else if (msg.includes("hint") && msg.startsWith("hint")) {
        hintCount = hintCount + (msg.match(new RegExp("hint", "g")) || []).length;
        switch (hintCount) {
          case 1:
            await message.reply(`ability key is: \`${answer.key}\``);
            break;
          case 2:
            await message.reply(
              `champion: \`${answer.champion
                .split(" ")
                .map((word) => "_".repeat(word.length))
                .join(" ")}\``,
            );
            break;
          default: {
            const temp = hintCount - 2;
            await message.reply(
              "champion: `" +
                answer.champion
                  .split(" ")
                  .map((word) => word.slice(0, temp).concat(temp < word.length ? "_".repeat(word.length - temp) : ""))
                  .join(" ") +
                "`",
            );
            break;
          }
        }
      } else if (msg === "again") {
        await message.reply({ files: [file] });
      } else {
        message.react("❌");
      }
    } catch (error) {
      console.error(error);
      global.gameOngoing[interaction.channel.id] = false;
      await message.reply(`<@${process.env.OWNER_ID}> help`);
    }
  });

  collector.on("end", async (collected) => {
    console.log(`Collected ${collected.size} items`);
    global.gameOngoing[interaction.channel.id] = false;
    if (collector.endReason === "limit") {
      await interaction.channel.send({
        content: `no one got the correct answer! the answer was: \`${answer.champion} ${answer.key} - ${answer.name}\``,
        files: [origFile],
      });
      return;
    }
    if (collector.endReason === "manual end") {
      await interaction.channel.send({
        content: `game ended. the answer was: \`${answer.champion} ${answer.key} - ${answer.name}\``,
        files: [origFile],
      });
      return;
    }
    if (collector.endReason === "correct answer") {
      await interaction.channel.send({
        content: `<@${winner.id}> won! the answer was: \`${answer.champion} ${answer.key} - ${answer.name}\``,
        files: [origFile],
      });
      return;
    }
  });
}

async function getData() {
  const startTime = performance.now();
  const res = await getRandomAbility();
  const endTime = performance.now();
  const duration = endTime - startTime;
  if (!res) return null;
  const { key, name, champion, icon, originalIcon } = res;

  const file = new AttachmentBuilder(icon, { name: "image.png" });
  const origFile = new AttachmentBuilder(originalIcon, { name: "original_image.png" });

  const embed = new EmbedBuilder()
    .setTitle("whose ability is this?")
    .setDescription(
      `
        answer in this format: \`<champion> <key>\`
        for example: \`Pyke Q\` (passive is \`P\`)

        you can also answer with the name of the ability
        for example: \`Bone Skewer\`

        end the game prematurely with \`end\`

        answer is case-insensitive
        `,
    )
    .setImage("attachment://image.png")
    .setFooter({
      text: `i'm still testing this --hikari\ntime taken: ${(duration / 1000).toFixed(2)}s`,
    });

  return {
    file: file,
    origFile: origFile,
    embed: embed,
    answer: {
      key: key,
      champion: champion,
      name: name,
    },
  };
}

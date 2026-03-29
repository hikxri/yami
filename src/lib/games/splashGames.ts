import {
  AttachmentBuilder,
  Message,
  MessageFlags,
  PartialGroupDMChannel,
  User,
  type ChatInputCommandInteraction,
} from "discord.js";
import { v4 as uuidv4 } from "uuid";
import type { SplashGameConfig, SplashGameSettings } from "./types";
import { log, logError } from "../log";

export async function runSplashGame(
  interaction: ChatInputCommandInteraction,
  gameName: string,
  config: SplashGameConfig,
  settings: SplashGameSettings,
): Promise<void> {
  if (!interaction.channel) return;
  if (interaction.channel instanceof PartialGroupDMChannel) return;
  // apparently you can't use collectors in "Partial Group DMs", whatever that is

  const channelId = interaction.channel!.id;

  if (global.gameOngoing[channelId]) {
    await interaction.reply({
      content: "a game is already ongoing in this channel",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const uuid = uuidv4();
  log(`${gameName} game started: ${uuid}`);
  global.gameOngoing[channelId] = true;

  await interaction.deferReply();

  let data;
  try {
    data = await config.getAnswer(settings.initial_size);
  } catch (e) {
    logError(e);
    global.gameOngoing[channelId] = false;
    await interaction.editReply("oops, try executing the command again.");
    return;
  }
  if (!data) {
    logError("Something went wrong when getting data.");
    global.gameOngoing[channelId] = false;
    await interaction.editReply("oops, try executing the command again.");
    return;
  }
  const { gameImage, originalImage, name, left, top, width, height } = data;
  let cropState = { left, top, width, height, size: settings.initial_size };

  const origFile = new AttachmentBuilder(originalImage, { name: "original_image.png" });
  let file = new AttachmentBuilder(gameImage, { name: "image.png" });

  const embed = config.buildEmbed(uuid);

  await interaction.editReply({ embeds: [embed], files: [file] });

  let winner: User | null = null;
  let answerCount = 0;

  const collectorFilter = (m: Message) => m.author.id !== process.env.CLIENT_ID;
  const collector = interaction.channel.createMessageCollector({
    filter: collectorFilter,
    max: 50,
  });

  collector.on("collect", async (message: Message) => {
    try {
      const msg = message.content.toLowerCase().trim();
      const result = data.checkAnswer(msg);

      // --- special words ---
      if (msg === "end") {
        collector.stop("manual end");
        return;
      }
      if (msg === "again") {
        await message.reply({ files: [file] });
        return;
      }
      if (msg.startsWith("maxhint") && message.author.id === process.env.OWNER_ID) {
        file = origFile;
        await message.reply({ files: [file] });
        return;
      }
      if (msg.includes("hint") && msg.startsWith("hint")) {
        await replyWithHint(1);
      }
      // --- check answer ---
      if (result === "correct") {
        message.react("✅");
        winner = message.author;
        collector.stop("correct answer");
      } else if (result === "partial") {
        answerCount++;
        message.react("🟨");
      } else {
        answerCount++;
        message.react("❌");
        if (settings.auto_hint && answerCount % settings.auto_hint_interval === 0 && answerCount > 0) {
          await replyWithHint(1);
        }
      }

      async function replyWithHint(hintCount: number) {
        const hint = await config.getHint(
          originalImage,
          cropState.size,
          settings.size_increase * hintCount,
          cropState.left,
          cropState.top,
          cropState.width,
          cropState.height,
        );
        cropState = { left: hint.left, top: hint.top, width: hint.width, height: hint.height, size: hint.size };
        file = new AttachmentBuilder(hint.image, { name: "image.png" });
        await message.reply({ files: [file] });
      }
    } catch (error) {
      logError(error);
      global.gameOngoing[channelId] = false;
      collector.stop("error");
      await message.reply(`<@${process.env.OWNER_ID}> help`);
    }
  });

  log(`${name} - ${uuid}`);

  collector.on("end", async () => {
    log(`${gameName} game ended: ${uuid}`);
    global.gameOngoing[channelId] = false;
    if (!interaction.channel || interaction.channel instanceof PartialGroupDMChannel) return;

    const endMessages: Record<string, string> = {
      limit: `no one got the correct answer! the answer was: ${name}\n-# game id: ${uuid}`,
      "manual end": `game ended. the answer was: ${name}\n-# game id: ${uuid}`,
      "correct answer": winner
        ? `<@${winner.id}> won! the answer was: ${name}\n-# game id: ${uuid}`
        : `no one won? hikari fix your bot\n-# game id: ${uuid}`,
    };
    await interaction.channel.send({
      content: endMessages[collector.endReason ?? ""] ?? null,
      files: [origFile],
    });
    return;
  });
}

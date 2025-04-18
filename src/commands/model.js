import { SlashCommandBuilder } from "discord.js";
import { model as apiModel } from "../lib/chatbot/api";
import { getDataFile } from "../lib/data";

export const data = new SlashCommandBuilder()
  .setName("model")
  .setDescription("what llm model she is using")
  .addStringOption((option) =>
    option
      .setName("is_local")
      .setDescription("api or local model")
      .setRequired(true)
      .addChoices(
        { name: "api", value: "api" },
        { name: "local", value: "local" },
      ),
  );

export async function execute(interaction) {
  const modelList = getDataFile().model;
  const localModel = Object.keys(modelList).find((key) => modelList[key]);

  const isLocal = interaction.options.getString("is_local") === "local";
  const model = isLocal ? localModel : apiModel;
  await interaction.reply(`i'm currently using \`${model}\` ${isLocal ? "locally" : "via api"}`);
}

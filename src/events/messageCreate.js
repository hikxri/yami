import { Events } from "discord.js";
import "dotenv/config";

export const name = Events.MessageCreate;
export const on = true;
export async function execute(message) {
  if (message.author.bot) return;

  if (message.content.trim() === `<@${process.env.CLIENT_ID}>`) {
    await message.reply("hi");
  }
}

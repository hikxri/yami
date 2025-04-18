import { Events } from "discord.js";
import "dotenv/config";
// import { chatbot } from "../lib/chatbot/chatbot";

export const name = Events.MessageCreate;
export const on = true;
export async function execute(message, client) {
  if (message.author.bot) return;
  // if (!global.gameOngoing[message.channel.id]) {
  //   chatbotCall(message, client);
  //   longChatbotCall(message, client);
  // }
}

async function chatbotCall(message, client) {
  if (message.content.toLowerCase().startsWith("yami ") || message.content.toLowerCase().startsWith("yami,")) {
    if (message.author.id === client.user.id) return;

    const prompt = message.content.slice(5).trim();
    const channel = message.channel;
    let typing;
    if (channel) {
      channel.sendTyping();
      typing = setInterval(() => channel.sendTyping(), 5000);
    }
    console.log("CHATBOT CALL BY", message.author.username);
    const response = await chatbot(true, "answer in short, " + prompt);
    clearInterval(typing);
    typing = null;
    try {
      message.reply({ content: response, allowedMentions: { repliedUser: false } });
    } catch (error) {
      console.error(error);
    }
  }
}


async function longChatbotCall(message, client) {
  if (message.content.toLowerCase().startsWith("yami:l") || message.content.toLowerCase().startsWith("yami-l")) {
    if (message.author.id === client.user.id) return;

    const prompt = message.content.slice(6).trim();
    const channel = message.channel;
    let typing;
    if (channel) {
      channel.sendTyping();
      typing = setInterval(() => channel.sendTyping(), 5000);
    }
    console.log("CHATBOT CALL BY", message.author.username);
    const response = await chatbot(true, prompt);
    clearInterval(typing);
    typing = null;
    try {
      message.reply({ content: response, allowedMentions: { repliedUser: false } });
    } catch (error) {
      console.error(error);
    }
  }
}

// async function delay(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

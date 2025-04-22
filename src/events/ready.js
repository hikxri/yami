import { Events } from "discord.js";
import { log } from "../lib/log";

export const name = Events.ClientReady;
export const once = true;

const messages = [
  "i'm awake",
  "i'm up",
  "bello",
  "i'm back",
  "hi chat",
  "good morning",
];

export async function execute(client) {
  log(`Logged in as ${client.user.tag}`);
  if (!global.testing && global.greeting) {
    client.channels
      .fetch("821046596216422400")
      .then((channel) =>
        channel.send(messages[Math.floor(Math.random() * messages.length)]),
      );
  }
}


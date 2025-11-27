import { Client, IntentsBitField, Collection, Partials } from "discord.js";
import fs from "fs";
import path from "path";
import "dotenv/config";
import { getDataFile } from "./lib/data";

console.log("Starting...");

const cfg = getDataFile();

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessages,
  ],
  partials: [
    Partials.Channel,
  ],
});

client.commands = new Collection();

// collect commands from files
const commandsFolderPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsFolderPath).filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const filePath = path.join(commandsFolderPath, file);
  const command = await import(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else if (!("data" in command)) {
    console.error(`Missing data property: ${filePath}`);
  } else {
    console.error(`Missing execute property: ${filePath}`);
  }
}

const eventsFolderPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsFolderPath).filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
  const filePath = path.join(eventsFolderPath, file);
  const event = await import(filePath);
  if (!(event?.once || event?.on)) {
    console.error(`Missing once or on property: ${filePath}`);
  } else if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

global.gameOngoing = {};
global.testing = cfg.testing;
global.greeting = cfg.greeting;

client.login(process.env.TOKEN);

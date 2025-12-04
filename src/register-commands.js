import { REST, Routes } from "discord.js";
import "dotenv/config";
import fs from "fs";
import path from "path";

const commands = [];
const GUILD_ONLY = true;

// collect commands from files
console.log("Collecting slash commands...");
const commandsFolderPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsFolderPath)
  .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));
for (const file of commandFiles) {
  const filePath = path.join(commandsFolderPath, file);
  const command = await import(filePath);
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else if (!("data" in command)) {
    console.error(`Missing data property: ${filePath}`);
  } else {
    console.error(`Missing execute property: ${filePath}`);
  }
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Registering slash commands...");
    console.log(`GUILD_ONLY: ${GUILD_ONLY}`);

    // refresh all commands
    const data = await rest.put(
      GUILD_ONLY
        ? Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID,
        )
        : Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(
      `Registered ${data.length} slash commands: ${data.map(
        (command) => command.name,
      )}`,
    );
  } catch (error) {
    console.error(error);
  }
})();

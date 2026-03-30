import { REST, Routes } from "discord.js";
import "dotenv/config";
import { getEnv } from "./lib/env";

const rest = new REST().setToken(getEnv("TOKEN"));

const GUILD_ONLY = false;

if (GUILD_ONLY) {
  (async () => {
    try {
      console.log("Started refreshing application (/) commands.");

      await rest.put(
        Routes.applicationGuildCommands(getEnv("CLIENT_ID"), getEnv("GUILD_ID")),
        { body: [] },
      );

      console.log("Successfully deleted all local application (/) commands.");
    } catch (error) {
      console.error(error);
    }
  })();
} else {
  (async () => {
    try {
      console.log("Started refreshing application (/) commands.");

      await rest.put(
        Routes.applicationCommands(getEnv("CLIENT_ID")),
        { body: [] },
      );

      console.log("Successfully deleted all global application (/) commands.");
    } catch (error) {
      console.error(error);
    }
  })();
}
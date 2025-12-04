import { REST, Routes } from "discord.js";
import "dotenv/config";

// const guildCommandsIdToDelete = ["1335314746190069830", "1335314746190069831"];
// const globalCommandsIdToDelete = [];

const rest = new REST().setToken(process.env.TOKEN);

// for (const id of guildCommandsIdToDelete) {
//   rest
//     .delete(Routes.applicationGuildCommand(process.env.CLIENT_ID, process.env.GUILD_ID, id))
//     .then(() => console.log("Successfully deleted guild command."))
//     .catch(console.error);
// }

// for (const id of globalCommandsIdToDelete) {
//   rest
//     .delete(Routes.applicationCommand(process.env.CLIENT_ID, id))
//     .then(() => console.log("Successfully deleted global command."))
//     .catch(console.error);
// }

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] },
    );

    console.log("Successfully deleted all global application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

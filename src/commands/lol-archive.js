import {
  AttachmentBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import {
  characterNames,
  itemNamesSet,
  itemMaps,
  getItemIcon,
  getAbilityIcon,
} from "../lib/lol/get";
import { loadCacheData } from "../lib/cache";
import { getAbilityInfo } from "../lib/archive/lol/ability";
import { getItemInfo } from "../lib/archive/lol/item";
import sharp from "sharp";

const maps = loadCacheData("lol/maps.json");

export const data = new SlashCommandBuilder()
  .setName("lol-archive")
  .setDescription("get info about stuff in league of legends")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("ability")
      .setDescription("get info about a champion's ability")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("champion name")
          .setAutocomplete(true)
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("key")
          .setDescription("ability key")
          .addChoices(
            { name: "Passive", value: "P" },
            { name: "Q", value: "Q" },
            { name: "W", value: "W" },
            { name: "E", value: "E" },
            { name: "R (Ultimate)", value: "R" },
          ),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("item")
      .setDescription("get info about an item")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("item name")
          .setAutocomplete(true)
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("map")
          .setDescription("map name")
          .setAutocomplete(true)
          .setRequired(true),
      ),
  );

export async function autocomplete(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const focus = interaction.options.getFocused(true);
  const text = focus.value.toLowerCase();

  if (subcommand === "ability") {
    let filtered = characterNames;
    filtered = Object.entries(characterNames).filter(([, name]) =>
      name.toLowerCase().includes(text),
    );
    filtered = filtered.map(([key, name]) => ({ name: name, value: key }));
    filtered = filtered.slice(0, 25);

    await interaction.respond(filtered);
  }

  if (subcommand === "item") {
    if (focus.name === "name") {
      let filtered = [...itemNamesSet].filter(
        // ignore funny xml names
        (name) => name.toLowerCase().includes(text) && !name.includes("<"),
      );
      filtered = filtered.map((name) => ({ name: name, value: name }));

      filtered.sort((a, b) => a.name.localeCompare(b.name));

      filtered = filtered.slice(0, 25);

      await interaction.respond(filtered);
    }

    if (focus.name === "map") {
      const itemName = interaction.options.getString("name", true);
      let mapChoices = [];
      if (itemMaps[itemName]) {
        console.log(itemMaps[itemName], maps[itemMaps[itemName][0].map]);
        mapChoices = itemMaps[itemName].map((item) => ({
          name: maps[item.map] || "Unknown",
          value: item.id,
        }));
      }

      await interaction.respond(mapChoices);
    }
  }
}

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const name = interaction.options.getString("name", true);
  let embed, file;
  if (subcommand === "ability") {
    const key = interaction.options.getString("key");
    if (key) {
      const res = await createAbilityEmbed(name, key);
      embed = res[0];
      file = res[1];
    } else {
      const res = await createAbilityEmbed(name, "Q");
      embed = res[0];
      file = res[1];
    }
  }

  if (subcommand === "item") {
    const id =
      interaction.options.getString("map", false) ?? itemMaps[name][0].id;
    const res = await createItemEmbed(id, name);
    embed = res[0];
    file = res[1];
  }

  await interaction.reply({
    content: embed ? null : name,
    embeds: embed ? [embed] : null,
    files: file ? [file] : null,
  });
}

async function createAbilityEmbed(championName, key) {
  const { name, cost, cooldown, damageType, spellEffect, description } =
    await getAbilityInfo(championName, key);
  const abilityIcon = await getAbilityIcon(championName, key);
  const file = new AttachmentBuilder(
    await sharp(abilityIcon).resize(128, 128).toBuffer(),
    { name: "image.png" },
  );

  const embed = new EmbedBuilder()
    .setTitle(name)
    .setDescription(
      `*${characterNames[championName]} - ${key}*\n` +
      cost +
        "\n" +
        (cooldown ? cooldown + "\n" : "") +
        (damageType ? damageType + "\n" : "") +
        (spellEffect ? spellEffect + "\n" : "") +
        "\n" +
        description.replace(/<br>/g, "\n\n"),
    )
    .setThumbnail("attachment://image.png")
    .setFooter({
      text: "league of legends abilities archive",
    });

  return [embed, file];
}

async function createItemEmbed(id, name) {
  const res = await getItemInfo(id);
  const icon = await getItemIcon(id);
  const file = new AttachmentBuilder(
    await sharp(icon).resize(128, 128).toBuffer(),
    { name: "image.png" },
  );
  const { stats, other, map } = res;

  const embed = new EmbedBuilder()
    .setTitle(name)
    .setDescription(
      (maps[map]?.mapName ? `*${maps[map].mapName}*\n\n` : "") +
        (stats ? stats + "\n\n" : "") +
        other,
    )
    .setFooter({
      text: "league of legends items archive",
    })
    .setThumbnail("attachment://image.png");

  return [embed, file];
}

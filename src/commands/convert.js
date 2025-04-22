import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { currencies, currencyChoices, convert } from "../lib/currency";

export const data = new SlashCommandBuilder()
  .setName("convert")
  .setDescription("convert from one currency to another")
  .addNumberOption((option) =>
    option
      .setName("value")
      .setDescription("the value to convert")
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("from")
      .setDescription("currency to convert from")
      .setRequired(true)
      .setAutocomplete(true),
  )
  .addStringOption((option) =>
    option
      .setName("to")
      .setDescription("currency to convert to (blank is USD)")
      .setRequired(false)
      .setAutocomplete(true),
  );

export async function autocomplete(interaction) {
  const focus = interaction.options.getFocused(true);
  const text = focus.value.toLowerCase();

  let filtered = currencyChoices;
  if (text) {
    filtered = currencyChoices.filter(
      (choice) =>
        (choice.name.toLowerCase().includes(text) ||
          choice.value.toLowerCase().includes(text)) &&
        choice.name,
    );
  }

  filtered = filtered.slice(0, 25);

  await interaction.respond(filtered);
}

export async function execute(interaction) {
  const value = interaction.options.getNumber("value");
  const fromCurrency = interaction.options.getString("from");
  const toCurrency = interaction.options.getString("to") || "USD";

  // console.log("convert", value, fromCurrency, toCurrency);

  const converted = convert(value, fromCurrency, toCurrency);

  if (!converted) {
    await interaction.reply({
      content: "invalid input!",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const { value: toValue, date } = converted;

  await interaction.reply(
    `${new Intl.NumberFormat().format(value)} ${
      currencies[fromCurrency.toLowerCase()]
    } (${fromCurrency.toUpperCase()}) is ${new Intl.NumberFormat().format(
      toValue.toFixed(2),
    )} ${currencies[toCurrency.toLowerCase()]} (${toCurrency.toUpperCase()})
-# as of ${new Date(date).toLocaleDateString()}`,
  );
}

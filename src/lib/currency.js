import { loadCacheData, writeCacheData } from "./cache";

let currenciesData, ratesData;
const data = loadCacheData("exchange/exchange.json");
currenciesData = data?.currenciesData;
ratesData = data?.ratesData;

if (!data || data?.ratesData?.date !== new Date().toISOString().split("T")[0]) {
  console.log(
    data
      ? "Exchange data is outdated, fetching from API..."
      : "Exchange data not found, fetching from API...",
  );
  currenciesData = await fetch(
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.min.json",
  ).then((res) => res.json());
  ratesData = await fetch(
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json",
  ).then((res) => res.json());

  writeCacheData("exchange/exchange.json", { currenciesData, ratesData });
}

export const currencies = currenciesData;

const { date, eur: rates } = ratesData;

export const currencyChoices = Object.entries(currenciesData).map(
  ([key, value]) => {
    return {
      name: value,
      value: key,
    };
  },
);

export function convert(value, from, to) {
  if (
    currenciesData[from.toLowerCase()] === undefined ||
    currenciesData[to.toLowerCase()] === undefined
  ) {
    return null;
  }

  const fromValueInEur = value / rates[from.toLowerCase()];
  return {
    value: fromValueInEur * rates[to.toLowerCase()],
    date: date,
  };
}

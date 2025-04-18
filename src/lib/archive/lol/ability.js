import { getCharacterInfo } from "../../lol/get";
import { getEmote } from "../../emote";

// for ability archive
const damageTypes = {
  physical_damage: getEmote("attackdamage") + " Physical Damage",
  mixed_damage: getEmote("mixeddamage") + " Mixed Damage",
  magic_damage: getEmote("abilitypower") + " Magic Damage",
};

const spellEffects = {
  spell: getEmote("range") + " Spell",
  basic: getEmote("range") + " Basic",
  spellaoe: getEmote("range") + " Spell AoE",
  aoedot: getEmote("range") + " AoE DoT",
  heal: getEmote("healthregen") + " Heal",
  special: getEmote("range") + " Special",
  proc: getEmote("range") + " Proc",
};

const resources = {
  mana: "mana",
  mana_per_second: "mana per second",
  energy: "energy",
  current_health: "current health",
  health: "health",
  other: "other",
};

function formatScaling(values, unit) {
  if (values.every((value) => value === values[0])) {
    return `${values[0]}${unit}`;
  }
  if (unit.includes("%")) {
    // value% / value% / value% ... / value% unit
    return `${values.slice(0, values.length - 1).join("% / ")}% / ${
      values[values.length - 1]
    }${unit}`;
  }
  return `${values.join(" / ")}${unit}`;
}

function formatDescription(text) {
  if (!text) return "";
  let result = "<start>" + text;
  const matches = result.match(/<start>[A-Za-z #-]+:/gm);

  if (matches) {
    for (const m of matches) {
      result = result.replace(m, `**${m}**`).trim();
    }
  }

  return result.replace("<start>", "");
}

function formatCost(cost, resource) {
  if (!cost) return getEmote("nocost") + " No cost";
  if (resource.toLowerCase().includes("mana")) {
    return `${getEmote("mana")} ${cost}`;
  }
  if (resource.toLowerCase().includes("health")) {
    return `${getEmote("health")} ${cost}`;
  }
  return `${getEmote("energy")} ${cost}`;
}

export async function getAbilityInfo(championName, key) {
  const characterData = await getCharacterInfo(championName);
  const ability = characterData.abilities[key][0];
  const {
    name,
    effects,
    resource,
    damageType,
    spellEffects: spellEffect,
    cost,
    cooldown,
  } = ability;

  const text = effects
    .map((effect) => {
      const { description, leveling } = effect;
      return (
        formatDescription(description) +
        (leveling.length === 0 ? "" : "\n") +
        // <attribute>: lv1/lv2/.../lv5 <unit1> + lv1/lv2/.../lv5 <unit2>
        // ex. Physical Damage: 70/80/90/100/110 + 90/95/100/105/110% bonus AD
        leveling
          .map((level) => {
            const { attribute, modifiers } = level;
            const value = modifiers
              .map((modifier) => {
                const values = modifier.values;
                const unit = modifier.units[0];
                return formatScaling(values, unit);
              })
              .join(" + ");
            return `-# - **${attribute}**: ${value}`;
          })
          .join("\n")
      );
    })
    .join("<br>");

  // lv1/lv2/.../lv5 <resource>
  let costs;
  if (cost) {
    costs = cost.modifiers
      ?.map((modifier) => {
        const values = modifier.values;
        const unit = modifier.units[0];
        return formatScaling(values, unit);
      })
      .join(" + ");
    costs += " " + (resources[resource.toLowerCase()] || resource);
  }

  // lv1/lv2/.../lv5
  const cooldowns = cooldown
    ? cooldown.modifiers?.map((modifier) => {
        const values = modifier.values;
        const unit = modifier.units[0];
        return formatScaling(values, unit);
        // add string to change [cooldown] to "cooldown"
      }) + ""
    : null;

  return {
    name: name,
    cost: formatCost(costs, resource),
    cooldown: cooldowns ? getEmote("cooldown") + " " + cooldowns : "",
    damageType: damageTypes[damageType?.toLowerCase()] ?? (damageType || ""),
    spellEffect:
      spellEffects[spellEffect?.toLowerCase()] ??
      (spellEffect ? getEmote("range") + " " + spellEffect : ""),
    description: text,
  };
}

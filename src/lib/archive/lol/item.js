import { itemMaps, items } from "../../lol/get";
import { customEmotes } from "../../emote";
import { JSDOM } from "jsdom";

// for item formatting
const formatRules = [
  {
    from: "attention",
    to: "**",
    wrap: true,
  },
  {
    from: "br",
    to: "\n",
  },
  {
    from: "passive",
    to: "**",
    wrap: true,
    // prefix: "UNIQUE PASSIVE: ",
    // preprefix: "### ",
  },
  {
    from: "active",
    to: "**",
    wrap: true,
    // prefix: "UNIQUE ACTIVE: ",
  },
  {
    from: "rarity",
    to: "**",
    wrap: true,
    flexible: true,
  },
  {
    from: "keyword",
    to: "**",
    wrap: true,
  },
  {
    from: "status",
    to: "**",
    wrap: true,
  },
  {
    from: "rules",
    to: "*",
    wrap: true,
  },
];

function format(str) {
  if (!str) return "";
  const dom = new JSDOM(str, { contentType: "text/html" });
  const doc = dom.window.document;

  function formatNode(node) {
    if (node.nodeType === 3) {
      return node.textContent;
    }

    let result = "";
    const tagName = node.nodeName.toLowerCase();
    // console.log(tagName);
    const rule = formatRules.find((formatRule) =>
      formatRule.flexible
        ? tagName.includes(formatRule.from)
        : formatRule.from === tagName,
    );
    const children = Array.from(node.childNodes)
      .map((child) => formatNode(child))
      .join("");

    if (rule) {
      if (rule.wrap) {
        result = `${rule.preprefix ?? ""}${rule.to}${
          rule.prefix ?? ""
        }${children}${rule.to}`;
      } else {
        result = `${rule.preprefix ?? ""}${rule.to}`;
      }
    } else {
      result = children;
    }

    return result;
  }

  return Array.from(doc.body.childNodes)
    .map((node) => formatNode(node))
    .join("")
    .trim();
}

function formatStats(str) {
  if (!str) return "";

  // TODO: use includes, not ===
  const emotesMap = {
    "ability power": "abilitypower",
    "adaptive force": "adaptiveforce",
    "armor": "armor",
    "armor penetration": "armorpen",
    "attack damage": "attackdamage",
    "attack speed": "attackspeed",
    "ability haste": "cdr",
    "critical strike chance": "critchance",
    "critical strike damage": "critdamage",
    "heal and shield power": "healshield",
    "base mana regen": "manaregen",
    "health": "health",
    "base health regen": "healthregen",
    "lethality": "armorpen",
    "life steal": "lifesteal",
    "magic penetration": "magicpen",
    "magic resist": "magicres",
    "move speed": "movementspeed",
    "omnivamp": "omnivamp",
    "range": "range",
    "tenacity": "tenacity",
  };

  return str
    .split("\n")
    .map((stat) => {
      const emoteName =
        emotesMap[
          stat
            .match(/[A-z| ]+/gm)[0]
            .toLowerCase()
            .trim()
        ];
      const emote = Object.entries(customEmotes).find(
        ([key]) => key.toLowerCase() === emoteName,
      );

      return `${emote ? `<:${emote[0]}:${emote[1]}>` : "- "}${stat}`;
    })
    .join("\n");
}

export async function getItemInfo(id) {
  const { name, description } = items[id];

  const dom = new JSDOM(description, { contentType: "text/html" });
  const doc = dom.window.document;

  const temp = doc.createElement("div");
  temp.innerHTML = description;

  const statsTemp = temp.querySelector("stats");
  const stats = statsTemp?.innerHTML.trim();
  if (statsTemp) {
    statsTemp.remove();
  }

  const other = temp.innerHTML.trim();

  const map = itemMaps[name].find((m) => m.id === id).map;

  return {
    stats: formatStats(format(stats)),
    other: format(other) || "-# *No description*",
    map: map,
  };
}

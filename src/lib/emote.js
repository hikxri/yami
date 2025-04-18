export const customEmotes = {
  air: "1344565040166211615",
  abilitypower: "1344138023813513248",
  adaptiveforce: "1344153032048377966",
  adaptiveforcescaling: "1344151742522327124",
  armor: "1344138774480949288",
  armorpen: "1344138778968723536",
  attackdamage: "1344138783909740604",
  attackspeed: "1344138788938715176",
  cdr: "1344138793342472263",
  cooldown: "1345030516101087313",
  critchance: "1344138798484951050",
  critdamage: "1344138803094487141",
  damageamp: "1344138808001564874",
  durability: "1344138813005631539",
  energy: "1344138822677430424",
  energyregen: "1344138827798810676",
  experience: "1344138855900778496",
  gold: "1344138868420771903",
  growth: "1344138874384810005",
  healpower: "1344138880366149733",
  healshield: "1344138887844597842",
  health: "1344138894874251356",
  healthregen: "1344138902042185778",
  hybridpen: "1344138909524824126",
  lifesteal: "1344138915778396292",
  magicpen: "1344138922480894024",
  magicres: "1344138931368890368",
  magicshield: "1344138938058543127",
  mana: "1344138946740883559",
  manaregen: "1344138953451769876",
  mixeddamage: "1345030504998502491",
  movementspeed: "1344138959709536348",
  nocost: "1345046979998388295",
  omnivamp: "1344138966428811306",
  physicalshield: "1344138971566837813",
  range: "1344138978147700788",
  spellvamp: "1344138983948423280",
  tenacity: "1344138991527661609",
};

export function getEmote(name) {
  return `<:${name}:${customEmotes[name]}>`;
}

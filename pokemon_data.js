/**
 * Pokemon Traditional Chinese (繁體中文) & English Pokédex Mapping
 */
const POKEMON_DICT = [
  { id: 1, zh: "妙蛙種子", en: "Bulbasaur" },
  { id: 2, zh: "妙蛙草", en: "Ivysaur" },
  { id: 3, zh: "妙蛙花", en: "Venusaur" },
  { id: 4, zh: "小火龍", en: "Charmander" },
  { id: 5, zh: "火恐龍", en: "Charmeleon" },
  { id: 6, zh: "噴火龍", en: "Charizard" },
  { id: 7, zh: "傑尼龜", en: "Squirtle" },
  { id: 8, zh: "卡咪龜", en: "Wartortle" },
  { id: 9, zh: "水箭龜", en: "Blastoise" },
  { id: 10, zh: "綠毛蟲", en: "Caterpie" },
  { id: 16, zh: "波波", en: "Pidgey" },
  { id: 25, zh: "皮卡丘", en: "Pikachu" },
  { id: 26, zh: "雷丘", en: "Raichu" },
  { id: 37, zh: "六尾", en: "Vulpix" },
  { id: 38, zh: "九尾", en: "Ninetales" },
  { id: 39, zh: "胖丁", en: "Jigglypuff" },
  { id: 52, zh: "喵喵", en: "Meowth" },
  { id: 54, zh: "可達鴨", en: "Psyduck" },
  { id: 58, zh: "卡蒂狗", en: "Growlithe" },
  { id: 59, zh: "風速狗", en: "Arcanine" },
  { id: 63, zh: "凱西", en: "Abra" },
  { id: 65, zh: "胡地", en: "Alakazam" },
  { id: 66, zh: "腕力", en: "Machop" },
  { id: 68, zh: "怪力", en: "Machamp" },
  { id: 74, zh: "小拳石", en: "Geodude" },
  { id: 76, zh: "隆隆岩", en: "Golem" },
  { id: 79, zh: "呆呆獸", en: "Slowpoke" },
  { id: 80, zh: "呆殼獸", en: "Slowbro" },
  { id: 92, zh: "鬼斯", en: "Gastly" },
  { id: 93, zh: "鬼斯通", en: "Haunter" },
  { id: 94, zh: "耿鬼", en: "Gengar" },
  { id: 95, zh: "大岩蛇", en: "Onix" },
  { id: 104, zh: "卡拉卡拉", en: "Cubone" },
  { id: 113, zh: "吉利蛋", en: "Chansey" },
  { id: 122, zh: "魔牆人偶", en: "Mr. Mime" },
  { id: 123, zh: "飛天螳螂", en: "Scyther" },
  { id: 129, zh: "鯉魚王", en: "Magikarp" },
  { id: 130, zh: "暴鯉龍", en: "Gyarados" },
  { id: 131, zh: "拉普拉斯", en: "Lapras" },
  { id: 132, zh: "百變怪", en: "Ditto" },
  { id: 133, zh: "伊布", en: "Eevee" },
  { id: 134, zh: "水伊布", en: "Vaporeon" },
  { id: 135, zh: "雷伊布", en: "Jolteon" },
  { id: 136, zh: "火伊布", en: "Flareon" },
  { id: 142, zh: "化石翼龍", en: "Aerodactyl" },
  { id: 143, zh: "卡比獸", en: "Snorlax" },
  { id: 144, zh: "急凍鳥", en: "Articuno" },
  { id: 145, zh: "閃電鳥", en: "Zapdos" },
  { id: 146, zh: "火焰鳥", en: "Moltres" },
  { id: 147, zh: "迷你龍", en: "Dratini" },
  { id: 148, zh: "哈克龍", en: "Dragonair" },
  { id: 149, zh: "快龍", en: "Dragonite" },
  { id: 150, zh: "超夢", en: "Mewtwo" },
  { id: 151, zh: "夢幻", en: "Mew" },
  { id: 152, zh: "菊草葉", en: "Chikorita" },
  { id: 155, zh: "火球鼠", en: "Cyndaquil" },
  { id: 158, zh: "小鋸鱷", en: "Totodile" },
  { id: 179, zh: "咩利羊", en: "Mareep" },
  { id: 196, zh: "太陽伊布", en: "Espeon" },
  { id: 197, zh: "月亮伊布", en: "Umbreon" },
  { id: 201, zh: "未知圖騰", en: "Unown" },
  { id: 212, zh: "巨鉗螳螂", en: "Scizor" },
  { id: 214, zh: "赫拉克羅斯", en: "Heracross" },
  { id: 246, zh: "由基拉", en: "Larvitar" },
  { id: 247, zh: "沙基拉斯", en: "Pupitar" },
  { id: 248, zh: "班基拉斯", en: "Tyranitar" },
  { id: 249, zh: "洛奇亞", en: "Lugia" },
  { id: 250, zh: "鳳王", en: "Ho-Oh" },
  { id: 252, zh: "木守宮", en: "Treecko" },
  { id: 255, zh: "火稚雞", en: "Torchic" },
  { id: 258, zh: "水躍魚", en: "Mudkip" },
  { id: 280, zh: "拉魯拉絲", en: "Ralts" },
  { id: 282, zh: "沙奈朵", en: "Gardevoir" },
  { id: 287, zh: "懶人獺", en: "Slakoth" },
  { id: 289, zh: "請假王", en: "Slaking" },
  { id: 304, zh: "可可多拉", en: "Aron" },
  { id: 371, zh: "寶貝龍", en: "Bagon" },
  { id: 372, zh: "甲殼龍", en: "Shelgon" },
  { id: 373, zh: "暴飛龍", en: "Salamence" },
  { id: 374, zh: "鐵啞鈴", en: "Beldum" },
  { id: 375, zh: "金屬怪", en: "Metang" },
  { id: 376, zh: "巨金怪", en: "Metagross" },
  { id: 380, zh: "拉帝亞斯", en: "Latias" },
  { id: 381, zh: "拉帝歐斯", en: "Latios" },
  { id: 382, zh: "蓋歐卡", en: "Kyogre" },
  { id: 383, zh: "固拉多", en: "Groudon" },
  { id: 384, zh: "烈空坐", en: "Rayquaza" },
  { id: 390, zh: "小火焰猴", en: "Chimchar" },
  { id: 393, zh: "波加曼", en: "Piplup" },
  { id: 443, zh: "圓陸鯊", en: "Gible" },
  { id: 444, zh: "尖牙陸鯊", en: "Gabite" },
  { id: 445, zh: "烈咬陸鯊", en: "Garchomp" },
  { id: 447, zh: "利歐路", en: "Riolu" },
  { id: 448, zh: "路卡利歐", en: "Lucario" },
  { id: 475, zh: "艾路雷朵", en: "Gallade" },
  { id: 483, zh: "帝牙盧卡", en: "Dialga" },
  { id: 484, zh: "帕路奇亞", en: "Palkia" },
  { id: 487, zh: "騎拉帝納", en: "Giratina" },
  { id: 610, zh: "牙牙", en: "Axew" },
  { id: 612, zh: "雙斧戰龍", en: "Haxorus" },
  { id: 633, zh: "單首龍", en: "Deino" },
  { id: 634, zh: "雙首暴龍", en: "Zweilous" },
  { id: 635, zh: "三首惡龍", en: "Hydreigon" },
  { id: 643, zh: "雷希拉姆", en: "Reshiram" },
  { id: 644, zh: "捷克羅姆", en: "Zekrom" },
  { id: 646, zh: "酋雷姆", en: "Kyurem" },
  { id: 704, zh: "黏黏寶", en: "Goomy" },
  { id: 706, zh: "黏美龍", en: "Goodra" },
  { id: 716, zh: "哲爾尼亞斯", en: "Xerneas" },
  { id: 717, zh: "伊裴爾塔爾", en: "Yveltal" },
  { id: 718, zh: "基格爾德", en: "Zygarde" },
  { id: 778, zh: "謎擬Ｑ", en: "Mimikyu" },
  { id: 782, zh: "心鱗寶", en: "Jangmo-o" },
  { id: 784, zh: "杖尾鱗甲龍", en: "Kommo-o" },
  { id: 888, zh: "蒼響", en: "Zacian" },
  { id: 889, zh: "藏瑪然特", en: "Zamazenta" },
  { id: 890, zh: "無極汰那", en: "Eternatus" },
  { id: 999, zh: "索財靈", en: "Gimmighoul" },
  { id: 1000, zh: "賽富豪", en: "Gholdengo" }
];

/**
 * Find Pokemon ID or Info by Chinese name, English name, or ID string
 */
function findPokemon(query) {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  
  // If it's a number
  const num = parseInt(q, 10);
  if (!isNaN(num)) {
    return POKEMON_DICT.find(p => p.id === num) || { id: num, zh: `寶可夢 #${num}`, en: `Pokemon #${num}` };
  }

  // Find by Chinese or English
  return POKEMON_DICT.find(p => 
    p.zh.toLowerCase() === q || 
    p.en.toLowerCase() === q || 
    p.zh.includes(query) || 
    p.en.toLowerCase().includes(q)
  );
}

if (typeof module !== 'undefined') {
  module.exports = { POKEMON_DICT, findPokemon };
}

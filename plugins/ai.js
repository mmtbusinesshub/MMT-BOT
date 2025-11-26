const axios = require("axios");

let inrToLkr = 3.4; 
async function updateExchangeRate() {
  try {
    const { data } = await axios.get("https://api.exchangerate.host/latest?base=INR&symbols=LKR");
    if (data?.rates?.LKR) {
      inrToLkr = data.rates.LKR;
      console.log(`💱 [MMT BUSINESS HUB] Updated INR→LKR rate: ${inrToLkr}`);
    }
  } catch (err) {
    console.error("⚠️ [MMT BUSINESS HUB] Failed to fetch INR→LKR rate:", err.message);
  }
}
updateExchangeRate();
setInterval(updateExchangeRate, 12 * 60 * 60 * 1000); 

function convertToLKR(priceStr) {
  if (!priceStr) return "";

  const mainMatch = priceStr.match(/₹\s*([\d,.]+)/);
  if (!mainMatch) return "";

  const inrValue = parseFloat(mainMatch[1].replace(/,/g, ''));

  const perMatch = priceStr.match(/PER\s*([\dKk]+)/i);
  let perText = perMatch ? perMatch[0] : "";

  const lkrValue = Math.round(inrValue * inrToLkr * 100) / 100; 

  return `${lkrValue} LKR ${perText}\n(${inrValue} INR - ${lkrValue} LKR)`;
}

function numberToEmoji(num) {
  const emojis = ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];
  return String(num).split("").map(d => emojis[parseInt(d)] || d).join("");
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function extractPriceRange(message) {
  const rangeMatch = message.match(/(\d+)\s*\$?\s*-\s*\$?\s*(\d+)/i);
  if (rangeMatch) return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]), type: 'range' };

  const singleMatch = message.match(/(\d+)\s*\$/g);
  if (singleMatch) {
    const prices = singleMatch.map(p => parseInt(p.replace(/\$/g, "")));
    return { min: Math.min(...prices), max: Math.max(...prices), type: prices.length > 1 ? 'multiple' : 'single' };
  }

  return null;
}

function extractNumericPrice(priceStr) {
  const match = priceStr.match(/₹\s*([\d,.]+)/);
  return match ? parseFloat(match[1].replace(/,/g, "")) : 0;
}

function filterServicesByPlatform(services, platform, serviceType = 'likes') {
  const plat = normalize(platform);
  const type = normalize(serviceType);
  return services.filter(service => {
    const sName = normalize(service.name);
    const sCat = normalize(service.category);
    const matchesPlatform = sName.includes(plat) || sCat.includes(plat);
    const matchesType = sName.includes(type) || sCat.includes(type) || sName.includes('follower') || sCat.includes('follower');
    return matchesPlatform && matchesType;
  });
}

function filterServicesByPrice(services, priceRange) {
  return services.filter(service => {
    const price = extractNumericPrice(service.price);
    return price >= priceRange.min && price <= priceRange.max;
  });
}

function sortServicesByPrice(services, ascending = true) {
  return services.sort((a, b) => {
    const aPrice = extractNumericPrice(a.price);
    const bPrice = extractNumericPrice(b.price);
    return ascending ? aPrice - bPrice : bPrice - aPrice;
  });
}

function getTopServices(services) {
  if (services.length <= 5) return services;
  const sorted = sortServicesByPrice(services);
  return [...sorted.slice(0, 3), ...sorted.slice(-2)];
}

function findMatchingServices(query, services) {
  if (!services || services.length === 0) return [];
  const normalizedQuery = normalize(query);

  const platforms = ['instagram','facebook','fb','ig','tiktok','youtube','telegram','twitter'];
  const serviceTypes = ['likes','followers','views','comments','shares'];

  let targetPlatform = null, targetServiceType = 'likes';

  for (const p of platforms) if (normalizedQuery.includes(p)) { targetPlatform = p; break; }
  for (const t of serviceTypes) if (normalizedQuery.includes(t)) { targetServiceType = t; break; }

  const priceRange = extractPriceRange(query);

  let filtered = services;
  if (targetPlatform) filtered = filterServicesByPlatform(filtered, targetPlatform, targetServiceType);
  if (priceRange) filtered = filterServicesByPrice(filtered, priceRange);
  else if (targetPlatform) filtered = getTopServices(filtered);

  return filtered;
}

function createSectionSeparator() { return "────────────────────"; }
function createServiceItem(service, index) {
  const emoji = numberToEmoji(index + 1);
  return `${emoji} *${service.name}*\n💰 Price: ${convertToLKR(service.price)}\n📦 Quantity: ${service.min}-${service.max}\n🔗 ${service.link}\n${createSectionSeparator()}`;
}

const channelJid = '120363423526129509@newsletter'; 
const channelName = 'ミ★ 𝙈𝙈𝙏 𝘽𝙐𝙎𝙄𝙉𝙀𝙎𝙎 𝙃𝙐𝘽 ★彡'; 
const serviceLogo = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/download.png?raw=true";

module.exports = {
  onMessage: async (conn, mek) => {
    try {
      const key = mek.key;
      const content = mek.message;
      if (!content || key.fromMe) return;

      const text = content.conversation || content.extendedTextMessage?.text || content.imageMessage?.caption || content.videoMessage?.caption || content.documentMessage?.caption || "";
      if (!text.trim()) return;

      const msg = text.toLowerCase();
      const from = key.remoteJid;

      const serviceKeywords = ["price","service","cost","purchase","order","rate","charges","facebook","fb","instagram","ig","youtube","tiktok","social media","marketing","followers","likes","views","comments","shares"];
      const isServiceQuery = serviceKeywords.some(k => msg.includes(k));
      if (!isServiceQuery) return;

      try { await conn.sendMessage(from, { react: { text: "❤️", key: mek.key } }); } catch{}

      let services;
      try { services = await global.mmtServices.getServices(); if (!services?.length) return; } catch { return; }

      const matches = findMatchingServices(text, services);
      if (!matches.length) return;

      let messageText = "🎯 *MATCHING SERVICES FOUND*\n\n";
      const matchesByCategory = {};
      matches.forEach(service => {
        if (!matchesByCategory[service.category]) matchesByCategory[service.category] = [];
        matchesByCategory[service.category].push(service);
      });

      let count = 0;
      Object.entries(matchesByCategory).forEach(([category, catServices]) => {
        messageText += `📂 *${category.toUpperCase()}*\n\n`;
        catServices.forEach(s => { messageText += createServiceItem(s, count) + "\n\n"; count++; });
      });

      messageText += `📞 *Support:* wa.me/94722136082\n🌐 *Website:* https://makemetrend.online`;

      await conn.sendMessage(from, {
        image: { url: serviceLogo },
        caption: messageText,
        contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: channelJid, newsletterName: channelName, serverMessageId: -1 } }
      }, { quoted: mek });

      console.log(`✅ [MMT BUSINESS HUB] Sent ${matches.length} service matches to ${from}`);
    } catch (err) {
      console.error("❌ [MMT BUSINESS HUB] AI plugin error:", err);
    }
  }
};

const axios = require("axios");

let lkrToUsd = 0.0033; // 1 LKR = 0.0033 USD (default)
let lkrToInr = 0.29;   // 1 LKR = 0.29 INR (default)

async function updateExchangeRates() {
  try {
    // Fetch LKR to USD rate
    const usdResponse = await axios.get("https://api.exchangerate.host/latest?base=LKR&symbols=USD");
    if (usdResponse.data?.rates?.USD) {
      lkrToUsd = usdResponse.data.rates.USD;
      console.log(`💱 [MMT BUSINESS HUB] Updated LKR→USD rate: ${lkrToUsd}`);
    }
    
    // Fetch LKR to INR rate
    const inrResponse = await axios.get("https://api.exchangerate.host/latest?base=LKR&symbols=INR");
    if (inrResponse.data?.rates?.INR) {
      lkrToInr = inrResponse.data.rates.INR;
      console.log(`💱 [MMT BUSINESS HUB] Updated LKR→INR rate: ${lkrToInr}`);
    }
  } catch (err) {
    console.error("⚠️ [MMT BUSINESS HUB] Failed to fetch exchange rates:", err.message);
  }
}
updateExchangeRates();
setInterval(updateExchangeRates, 12 * 60 * 60 * 1000); 

// Parse rate string that may contain commas (e.g., "15,101.05")
function parseRateString(rateStr) {
  if (!rateStr) return 0;
  // Remove commas and convert to number
  return parseFloat(rateStr.replace(/,/g, ''));
}

function convertFromLKR(rateInLKR) {
  if (!rateInLKR || isNaN(rateInLKR)) return null;
  
  const lkrValue = parseRateString(rateInLKR.toString());
  
  // Convert LKR to USD and INR (keep all decimal places)
  const usdValue = (lkrValue * lkrToUsd);
  const inrValue = (lkrValue * lkrToInr);
  
  return {
    lkr: lkrValue,
    usd: usdValue,
    inr: inrValue
  };
}

function formatPriceDisplay(service) {
  const rate = service.rate; // API returns rate as string like "0.90" or "15,101.05"
  const converted = convertFromLKR(rate);
  
  if (!converted) return "Price not available";
  
  // Format numbers with commas and keep all decimal places
  const formatNumber = (num) => {
    // Split into integer and decimal parts
    const [intPart, decPart] = num.toString().split('.');
    // Add commas to integer part
    const formattedInt = parseInt(intPart).toLocaleString();
    // Return with decimal part if exists
    return decPart ? `${formattedInt}.${decPart}` : formattedInt;
  };
  
  return `┌─ 💰 *Price Details*\n` +
         `│ 📍 LKR: Rs ${formatNumber(converted.lkr)} PER 1K\n` +
         `│ 💵 USD: $${formatNumber(converted.usd)} PER 1K\n` +
         `│ 💴 INR: ₹${formatNumber(converted.inr)} PER 1K\n` +
         `│ 🆔 Service ID: ${service.service}\n` +
         `└────────────`;
}

function numberToEmoji(num) {
  const emojis = ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];
  return String(num).split("").map(d => emojis[parseInt(d)] || d).join("");
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function extractNumericPrice(service) {
  return parseRateString(service.rate);
}

function detectServiceType(query) {
  const normalized = normalize(query);
  
  const types = {
    'followers': ['follower', 'followers', 'foll', 'subscriber', 'subscribers'],
    'likes': ['like', 'likes', 'lik'],
    'views': ['view', 'views', 'vw'],
    'comments': ['comment', 'comments', 'cmt'],
    'shares': ['share', 'shares']
  };
  
  for (const [type, keywords] of Object.entries(types)) {
    if (keywords.some(k => normalized.includes(k))) {
      return type;
    }
  }
  
  return 'followers';
}

function detectPlatform(query) {
  const normalized = normalize(query);
  
  const platforms = {
    'instagram': ['instagram', 'ig', 'insta'],
    'facebook': ['facebook', 'fb', 'meta'],
    'tiktok': ['tiktok', 'tt'],
    'youtube': ['youtube', 'yt', 'tube'],
    'telegram': ['telegram', 'tg'],
    'twitter': ['twitter', 'twt', 'x']
  };
  
  for (const [platform, keywords] of Object.entries(platforms)) {
    if (keywords.some(k => normalized.includes(k))) {
      return platform;
    }
  }
  
  return null;
}

function filterServicesByType(services, platform, serviceType) {
  if (!services || !services.length) return [];
  
  const normalizedPlatform = platform ? normalize(platform) : '';
  const normalizedType = serviceType ? normalize(serviceType) : '';
  
  return services.filter(service => {
    const name = normalize(service.name);
    const category = normalize(service.category);
    
    const matchesPlatform = !platform || 
      name.includes(normalizedPlatform) || 
      category.includes(normalizedPlatform);
    
    const matchesType = !serviceType || 
      name.includes(normalizedType) || 
      category.includes(normalizedType);
    
    return matchesPlatform && matchesType;
  });
}

function getTopServices(services) {
  if (!services || services.length === 0) return [];
  
  // Sort by rate (LKR price)
  const sorted = [...services].sort((a, b) => {
    const priceA = extractNumericPrice(a);
    const priceB = extractNumericPrice(b);
    return priceA - priceB;
  });
  
  // Get 3 lowest and 2 highest
  const lowest = sorted.slice(0, 3);
  const highest = sorted.slice(-2);
  
  // Combine
  return [...lowest, ...highest];
}

function createServiceItem(service, index) {
  const emoji = numberToEmoji(index + 1);
  const priceDisplay = formatPriceDisplay(service);
  
  return `${emoji} *${service.name}*\n` +
         `${priceDisplay}\n` +
         `📦 Min: ${service.min} | Max: ${service.max}\n` +
         `🔗 https://makemetrend.online/services\n` +
         `────────────────────`;
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

      const text = content.conversation || 
                  content.extendedTextMessage?.text || 
                  content.imageMessage?.caption || 
                  content.videoMessage?.caption || 
                  content.documentMessage?.caption || "";
      
      if (!text.trim()) return;

      const msg = text.toLowerCase();
      const from = key.remoteJid;

      const serviceKeywords = [
        "price", "service", "cost", "purchase", "order", "rate", "charges",
        "facebook", "fb", "instagram", "ig", "youtube", "tiktok", "telegram",
        "social media", "marketing", "followers", "likes", "views", "comments"
      ];
      
      const isServiceQuery = serviceKeywords.some(k => msg.includes(k));
      if (!isServiceQuery) return;

      await conn.sendPresenceUpdate('composing', from);
      
      try { 
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } }); 
      } catch{}

      let services;
      try { 
        services = await global.mmtServices.getServices(); 
        if (!services?.length) return; 
      } catch { 
        return; 
      }

      const platform = detectPlatform(text);
      const serviceType = detectServiceType(text);
      
      console.log(`[MMT BUSINESS HUB] Detected: Platform=${platform}, Type=${serviceType}`);

      let filtered = filterServicesByType(services, platform, serviceType);
      
      if (filtered.length === 0 && platform) {
        filtered = filterServicesByType(services, null, serviceType);
      }
      
      if (filtered.length === 0) {
        filtered = filterServicesByType(services, null, serviceType);
      }

      if (filtered.length === 0) return;

      const selectedServices = getTopServices(filtered);

      let messageText = "╭━━━〔 🎯 *MATCHING SERVICES* 〕━━━╮\n\n";
      
      if (platform) {
        messageText += `📱 *Platform:* ${platform.toUpperCase()}\n`;
      }
      if (serviceType) {
        messageText += `🎯 *Service:* ${serviceType.toUpperCase()}\n`;
      }
      messageText += `━━━━━━━━━━━━━━━━━━━━\n\n`;

      selectedServices.forEach((service, index) => {
        messageText += createServiceItem(service, index) + "\n\n";
      });

      messageText += `━━━━━━━━━━━━━━━━━━━━\n`;
      messageText += `📞 *Support:* wa.me/94722136082\n`;
      messageText += `🌐 *Website:* https://makemetrend.online\n`;
      messageText += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      messageText += `_💡 Reply with .order <service_id> <quantity> to place an order_`;

      await conn.sendMessage(from, {
        image: { url: serviceLogo },
        caption: messageText,
        contextInfo: { 
          forwardingScore: 999, 
          isForwarded: true, 
          forwardedNewsletterMessageInfo: { 
            newsletterJid: channelJid, 
            newsletterName: channelName, 
            serverMessageId: -1 
          } 
        }
      }, { quoted: mek });

      console.log(`✅ [MMT BUSINESS HUB] Sent ${selectedServices.length} service matches to ${from}`);
      
    } catch (err) {
      console.error("❌ [MMT BUSINESS HUB] AI plugin error:", err);
    }
  }
};

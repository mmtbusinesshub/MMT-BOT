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
  if (!priceStr) return "Price not available";
  
  // Extract INR price (handle different formats)
  const inrMatch = priceStr.match(/₹?\s*([\d,.]+)/);
  if (!inrMatch) return priceStr; // Return original if no INR found
  
  const inrValue = parseFloat(inrMatch[1].replace(/,/g, ''));
  if (isNaN(inrValue)) return priceStr;
  
  // Extract per unit info (per 1000, per 1k, etc)
  const perMatch = priceStr.match(/per\s*([\d,.]+k?)/i);
  const perText = perMatch ? ` per ${perMatch[1]}` : "";
  
  const lkrValue = Math.round(inrValue * inrToLkr);
  
  return `Rs. ${lkrValue.toLocaleString()} LKR${perText}`;
}

function numberToEmoji(num) {
  const emojis = ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];
  return String(num).split("").map(d => emojis[parseInt(d)] || d).join("");
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function extractNumericPrice(priceStr) {
  const match = priceStr.match(/₹?\s*([\d,.]+)/);
  return match ? parseFloat(match[1].replace(/,/g, "")) : 0;
}

function detectServiceType(query) {
  const normalized = normalize(query);
  
  // Service type mapping
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
  
  return 'followers'; // Default to followers if no specific type detected
}

function detectPlatform(query) {
  const normalized = normalize(query);
  
  // Platform mapping
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
  
  const normalizedPlatform = normalize(platform || '');
  const normalizedType = normalize(serviceType || '');
  
  return services.filter(service => {
    const name = normalize(service.name);
    const category = normalize(service.category);
    
    // Check if service matches platform
    const matchesPlatform = !platform || 
      name.includes(normalizedPlatform) || 
      category.includes(normalizedPlatform);
    
    // Check if service matches type
    const matchesType = !serviceType || 
      name.includes(normalizedType) || 
      category.includes(normalizedType);
    
    return matchesPlatform && matchesType;
  });
}

function getPriceSortedServices(services) {
  // Sort services by price
  const sorted = [...services].sort((a, b) => {
    const priceA = extractNumericPrice(a.price);
    const priceB = extractNumericPrice(b.price);
    return priceA - priceB;
  });
  
  // Get 3 lowest and 2 highest
  const lowest = sorted.slice(0, 3);
  const highest = sorted.slice(-2);
  
  // Combine and remove duplicates
  const combined = [...lowest, ...highest];
  const unique = combined.filter((service, index, self) => 
    index === self.findIndex(s => s.service_id === service.service_id)
  );
  
  return unique;
}

function createServiceItem(service, index) {
  const emoji = numberToEmoji(index + 1);
  const lkrPrice = convertToLKR(service.price);
  
  return `${emoji} *${service.name}*\n` +
         `💰 Price: ${lkrPrice}\n` +
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

      // Keywords to trigger service response
      const serviceKeywords = [
        "price", "service", "cost", "purchase", "order", "rate", "charges",
        "facebook", "fb", "instagram", "ig", "youtube", "tiktok", "telegram",
        "social media", "marketing", "followers", "likes", "views", "comments"
      ];
      
      const isServiceQuery = serviceKeywords.some(k => msg.includes(k));
      if (!isServiceQuery) return;

      // Send typing indicator
      await conn.sendPresenceUpdate('composing', from);
      
      // React to message
      try { 
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } }); 
      } catch{}

      // Get services
      let services;
      try { 
        services = await global.mmtServices.getServices(); 
        if (!services?.length) return; 
      } catch { 
        return; 
      }

      // Detect what user wants
      const platform = detectPlatform(text);
      const serviceType = detectServiceType(text);
      
      console.log(`[MMT BUSINESS HUB] Detected: Platform=${platform}, Type=${serviceType}`);

      // Filter services
      let filtered = filterServicesByType(services, platform, serviceType);
      
      // If no matches with specific platform, try without platform
      if (filtered.length === 0 && platform) {
        filtered = filterServicesByType(services, null, serviceType);
      }
      
      // If still no matches, show popular services of detected type
      if (filtered.length === 0) {
        filtered = filterServicesByType(services, null, serviceType);
      }

      if (filtered.length === 0) return;

      // Get 3 lowest and 2 highest price services
      const selectedServices = getPriceSortedServices(filtered);

      // Build response message
      let messageText = "╭━━━〔 🎯 *MATCHING SERVICES* 〕━━━╮\n\n";
      
      if (platform) {
        messageText += `📱 *Platform:* ${platform.toUpperCase()}\n`;
      }
      if (serviceType) {
        messageText += `🎯 *Service:* ${serviceType.toUpperCase()}\n`;
      }
      messageText += `━━━━━━━━━━━━━━━━━━━━\n\n`;

      // Add services
      selectedServices.forEach((service, index) => {
        messageText += createServiceItem(service, index) + "\n\n";
      });

      messageText += `━━━━━━━━━━━━━━━━━━━━\n`;
      messageText += `📞 *Support:* wa.me/94722136082\n`;
      messageText += `🌐 *Website:* https://makemetrend.online\n`;
      messageText += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      messageText += `_💡 Reply with .order to place an order_`;

      // Send response with image
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

const axios = require("axios");

let lkrToUsd = 0.0033;
let lkrToInr = 0.29;

// Platform-specific default services (when only platform is mentioned)
const PLATFORM_DEFAULTS = {
    tiktok: 'followers',
    instagram: 'followers',
    facebook: 'followers',
    youtube: 'views',
    whatsapp: 'channel'
};

// Service type keywords (for matching in service names)
const SERVICE_KEYWORDS = {
    followers: ['follower', 'followers', 'fans'],
    subscribers: ['subscriber', 'subscribers', 'subs'],
    likes: ['like', 'likes', 'heart', 'hearts', 'reaction', 'reactions'],
    views: ['view', 'views', 'plays', 'watch'],
    comments: ['comment', 'comments', 'reply'],
    shares: ['share', 'shares', 'repost'],
    saves: ['save', 'saves', 'bookmark'],
    story: ['story', 'stories'],
    live: ['live', 'stream'],
    channel: ['channel', 'members'],
    reactions: ['reaction', 'emoji'],
    watchtime: ['watch time', 'hours'],
    group: ['group'],
    poll: ['poll', 'vote']
};

// Platform keywords with variations
const PLATFORM_KEYWORDS = {
    tiktok: ['tiktok', 'tt'],
    instagram: ['instagram', 'ig', 'insta'],
    facebook: ['facebook', 'fb'],
    youtube: ['youtube', 'yt'],
    whatsapp: ['whatsapp', 'wa']
};

// Keep exchange rate functions unchanged
async function updateExchangeRates() {
    try {
        const usdResponse = await axios.get("https://api.exchangerate.host/latest?base=LKR&symbols=USD");
        if (usdResponse.data?.rates?.USD) {
            lkrToUsd = usdResponse.data.rates.USD;
        }
        const inrResponse = await axios.get("https://api.exchangerate.host/latest?base=LKR&symbols=INR");
        if (inrResponse.data?.rates?.INR) {
            lkrToInr = inrResponse.data.rates.INR;
        }
    } catch (err) {
        console.error("⚠️ [AI PLUGIN] Failed to fetch exchange rates:", err.message);
    }
}
updateExchangeRates();
setInterval(updateExchangeRates, 12 * 60 * 60 * 1000);

// Helper functions (unchanged)
function extractLKRPrice(priceStr) {
    if (!priceStr) return 0;
    const priceString = String(priceStr);
    const match = priceString.match(/(?:Rs\.?|LKR)?\s*([\d,.]+)/i);
    if (match) {
        const cleaned = match[1].replace(/,/g, '');
        return parseFloat(cleaned);
    }
    return 0;
}

function convertFromLKR(priceInLKR) {
    if (!priceInLKR || isNaN(priceInLKR)) return null;
    return {
        lkr: priceInLKR,
        usd: priceInLKR * lkrToUsd,
        inr: priceInLKR * lkrToInr
    };
}

function formatWithTwoDecimals(num) {
    if (num === null || isNaN(num)) return "0.00";
    const numStr = num.toString();
    if (numStr.includes('.')) {
        const [intPart, decPart] = numStr.split('.');
        const twoDecimals = decPart.substring(0, 2).padEnd(2, '0');
        const intNum = parseInt(intPart);
        const formattedInt = intNum >= 1000 ? intNum.toLocaleString() : intPart;
        return `${formattedInt}.${twoDecimals}`;
    } else {
        const intNum = parseInt(numStr);
        const formattedInt = intNum >= 1000 ? intNum.toLocaleString() : numStr;
        return `${formattedInt}.00`;
    }
}

function formatLKRPrice(price) {
    if (price === null || isNaN(price)) return "0";
    const numStr = price.toString();
    if (numStr.includes('.')) {
        const [intPart, decPart] = numStr.split('.');
        const intNum = parseInt(intPart);
        const formattedInt = intNum >= 1000 ? intNum.toLocaleString() : intPart;
        if (parseFloat(`0.${decPart}`) > 0) {
            return `${formattedInt}.${decPart}`;
        }
        return formattedInt;
    } else {
        const intNum = parseInt(numStr);
        return intNum >= 1000 ? intNum.toLocaleString() : numStr;
    }
}

function formatPriceDisplay(service) {
    const lkrPrice = extractLKRPrice(service.price);
    const converted = convertFromLKR(lkrPrice);
    if (!converted) return "Price not available";
    const priceString = String(service.price);
    const perMatch = priceString.match(/per\s*([\d,.]+k?)/i);
    const perText = perMatch ? ` per ${perMatch[1]}` : "";
    const lkrFormatted = formatLKRPrice(converted.lkr);
    return `┌─ 💰 *Price Details*\n` +
           `│ 📍 LKR: Rs. ${lkrFormatted}${perText}\n` +
           `│ 💵 USD: $${formatWithTwoDecimals(converted.usd)}${perText}\n` +
           `│ 🆔 Service ID: ${service.service_id}\n` +
           `└────────────`;
}

function numberToEmoji(num) {
    const emojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
    return String(num).split("").map(d => emojis[parseInt(d)] || d).join("");
}

function normalize(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractNumericPrice(service) {
    return extractLKRPrice(service.price);
}

// ------------------- NEW SIMPLE DETECTION & FILTERING -------------------

/**
 * Detect platform and service from user query using keyword matching
 */
function detectFromQuery(query) {
    const normalized = normalize(query);
    let detectedPlatform = null;
    let detectedService = null;

    // Find platform
    for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
        for (const kw of keywords) {
            if (normalized.includes(kw)) {
                detectedPlatform = platform;
                break;
            }
        }
        if (detectedPlatform) break;
    }

    // Find service
    for (const [serviceType, keywords] of Object.entries(SERVICE_KEYWORDS)) {
        for (const kw of keywords) {
            if (normalized.includes(kw)) {
                detectedService = serviceType;
                break;
            }
        }
        if (detectedService) break;
    }

    // Handle special conversions
    if (detectedPlatform === 'youtube' && detectedService === 'followers') {
        detectedService = 'subscribers';
    } else if (detectedPlatform !== 'youtube' && detectedService === 'subscribers') {
        detectedService = 'followers';
    }

    return { platform: detectedPlatform, service: detectedService };
}

/**
 * Filter services based on detected platform and service.
 * Uses simple substring matching: service name must contain the platform keyword and at least one service keyword.
 */
function filterServicesSimple(services, platform, service) {
    if (!services || !services.length) return [];

    const platformLower = platform ? platform.toLowerCase() : null;
    const serviceLower = service ? service.toLowerCase() : null;

    // Get all keywords for the platform
    const platformKeywords = platformLower ? PLATFORM_KEYWORDS[platformLower] || [platformLower] : null;

    // Get all keywords for the service type
    const serviceKeywords = serviceLower ? SERVICE_KEYWORDS[serviceLower] : null;

    return services.filter(svc => {
        const name = normalize(svc.name || "");

        // Platform check
        if (platformKeywords) {
            const hasPlatform = platformKeywords.some(kw => name.includes(kw));
            if (!hasPlatform) return false;
        }

        // Service check
        if (serviceKeywords) {
            const hasService = serviceKeywords.some(kw => name.includes(kw));
            if (!hasService) return false;
        }

        return true;
    });
}

/**
 * Get 5 services: 3 cheapest, 2 most expensive, avoiding duplicates.
 */
function getPriceExtremes(services) {
    if (!services.length) return [];
    if (services.length <= 5) return services;

    // Sort by price ascending
    const sorted = [...services].sort((a, b) => extractNumericPrice(a) - extractNumericPrice(b));

    const cheapest = sorted.slice(0, 3);
    const mostExpensive = sorted.slice(-2);

    // Combine and deduplicate by service_id
    const combined = [...cheapest, ...mostExpensive];
    const unique = combined.filter((svc, idx, self) =>
        idx === self.findIndex(s => s.service_id === svc.service_id)
    );

    // If duplicates removed and we have less than 5, add more from middle if needed (optional)
    // For simplicity, just return what we have, it's fine.
    return unique;
}

// ------------------- END NEW FILTERING -------------------

// Constants
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

            const from = key.remoteJid;
            const query = text.toLowerCase();

            // Service trigger keywords
            const serviceTriggers = [
                'price', 'cost', 'rate', 'service', 'buy', 'purchase', 'order',
                'follower', 'like', 'view', 'comment', 'share', 'repost', 'save',
                'reaction', 'live', 'stream', 'subscriber', 'member', 'channel',
                'instagram', 'facebook', 'tiktok', 'youtube', 'whatsapp',
                'ig', 'fb', 'tt', 'yt', 'wa'
            ];
            const isServiceQuery = serviceTriggers.some(t => query.includes(t));
            if (!isServiceQuery) return;

            await conn.sendPresenceUpdate('composing', from);
            try {
                await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
            } catch {}

            // Fetch services
            let services;
            try {
                services = await global.mmtServices.getServices();
                if (!services?.length) return;
            } catch {
                return;
            }

            // Detect platform and service from query
            const { platform, service } = detectFromQuery(text);

            console.log('\n📊 [QUERY] ==================');
            console.log('📝 Query    :', text);
            console.log('📱 Platform :', platform || '❌');
            console.log('🎯 Service  :', service || '❌');
            console.log('================================\n');

            // Filter services based on detection
            let filtered = filterServicesSimple(services, platform, service);

            // If no results and platform detected, show all platform services
            if (filtered.length === 0 && platform) {
                filtered = filterServicesSimple(services, platform, null);
                console.log(`ℹ️ No specific matches, showing all ${platform} services`);
            }

            // If still no results, fallback to a few random services
            if (filtered.length === 0) {
                filtered = services.slice(0, 10);
                console.log('ℹ️ No matches found, showing popular services');
            }

            // Select 5 services (3 cheapest + 2 most expensive)
            const selectedServices = getPriceExtremes(filtered);

            // Build response
            let messageText = "╭━━━〔 🎯 *SMM SERVICES* 〕━━━━╮\n\n";

            // Add platform/service summary
            if (platform) {
                const platformEmoji = { tiktok: '🎵', instagram: '📷', facebook: '👤', youtube: '▶️', whatsapp: '💬' }[platform] || '📱';
                messageText += `${platformEmoji} *Platform:* ${platform.toUpperCase()}\n`;
            }
            if (service) {
                const serviceEmoji = {
                    followers: '👥', subscribers: '📺', likes: '❤️', views: '👀',
                    comments: '💬', shares: '🔄', saves: '🔖', story: '📖',
                    live: '🔴', channel: '📢', reactions: '😊', watchtime: '⏱️',
                    group: '👥', poll: '📊'
                }[service] || '🎯';
                messageText += `${serviceEmoji} *Service:* ${service.toUpperCase()}\n`;
            }
            messageText += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            selectedServices.forEach((svc, idx) => {
                messageText += createServiceItem(svc, idx) + "\n\n";
            });

            // Add tip if only platform
            if (platform && !service) {
                messageText += `💡 *Tip:* Be more specific! Try "${platform} likes" or "${platform} views"\n\n`;
            } else if (!platform && service) {
                messageText += `💡 *Tip:* Add a platform like "instagram ${service}" for better results\n\n`;
            }

            messageText += `📞 *Support:* wa.me/94722136082\n`;
            messageText += `🌐 *Website:* https://makemetrend.online\n`;
            messageText += `╰━━━━━━━━━━━━━━━━━━━━━━━━╯`;

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

            console.log(`✅ [AI PLUGIN] Sent ${selectedServices.length} services to ${from}`);
        } catch (err) {
            console.error("❌ [AI PLUGIN] Error:", err);
        }
    }
};

// Helper to create service item (unchanged)
function createServiceItem(service, index) {
    const emoji = numberToEmoji(index + 1);
    const priceDisplay = formatPriceDisplay(service);
    return `${emoji} *${service.name}*\n` +
           `${priceDisplay}\n` +
           `📦 Min: ${service.min} | Max: ${service.max}\n` +
           `🔗 https://makemetrend.online/services\n` +
           `────────────────────`;
}

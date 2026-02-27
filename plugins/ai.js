const axios = require("axios");

let lkrToUsd = 0.0033;
let lkrToInr = 0.29;

// Exchange rate functions (unchanged)
async function updateExchangeRates() {
    try {
        const usdResponse = await axios.get("https://api.exchangerate.host/latest?base=LKR&symbols=USD");
        if (usdResponse.data?.rates?.USD) lkrToUsd = usdResponse.data.rates.USD;
        const inrResponse = await axios.get("https://api.exchangerate.host/latest?base=LKR&symbols=INR");
        if (inrResponse.data?.rates?.INR) lkrToInr = inrResponse.data.rates.INR;
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
    return { lkr: priceInLKR, usd: priceInLKR * lkrToUsd, inr: priceInLKR * lkrToInr };
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
        if (parseFloat(`0.${decPart}`) > 0) return `${formattedInt}.${decPart}`;
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

// Platform keywords (from your service names)
const PLATFORM_KEYWORDS = {
    tiktok: ['tiktok', 'tt'],
    instagram: ['instagram', 'ig', 'insta'],
    facebook: ['facebook', 'fb'],
    youtube: ['youtube', 'yt'],
    whatsapp: ['whatsapp', 'wa']
};

// Service keywords (based on your actual service names)
const SERVICE_KEYWORDS = {
    // Core services
    followers: ['follower', 'followers'],
    likes: ['like', 'likes'],
    views: ['view', 'views'],
    comments: ['comment', 'comments'],
    
    // Platform-specific variations
    'video views': ['video views', 'video view'],
    'story views': ['story views', 'story view'],
    'story reactions': ['story reactions', 'story reaction'],
    'post likes': ['post likes', 'post like'],
    'page likes': ['page likes', 'page like'],
    'channel members': ['channel members', 'channel member'],
    'channel reactions': ['channel reactions', 'emoji reactions'],
    'live views': ['live views', 'live stream views'],
    'watch time': ['watch time', 'watch hours', 'watchtime'],
    'subscribers': ['subscriber', 'subscribers', 'subs'],
    'reposts': ['repost', 'reposts', 'share', 'shares'],
    'saves': ['save', 'saves'],
    'group members': ['group members', 'group member'],
    'poll votes': ['poll votes', 'poll vote'],
    
    // Combined services (will match if any keyword appears)
    'page likes + followers': ['page likes', 'followers'], // Will match both
};

// Extract platform from query
function detectPlatform(query) {
    const normalized = normalize(query);
    for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
        for (const keyword of keywords) {
            if (normalized.includes(keyword)) return platform;
        }
    }
    return null;
}

// Extract service type from query
function detectService(query) {
    const normalized = normalize(query);
    
    // Check for multi-word services first (longer phrases)
    const multiWordServices = [
        'video views', 'story views', 'story reactions', 'post likes', 
        'page likes', 'channel members', 'channel reactions', 'live views',
        'watch time', 'group members', 'poll votes'
    ];
    
    for (const service of multiWordServices) {
        if (normalized.includes(service)) return service;
    }
    
    // Check single-word services
    const singleWordServices = [
        'followers', 'likes', 'views', 'comments', 'subscribers',
        'reposts', 'saves', 'shares'
    ];
    
    for (const service of singleWordServices) {
        if (normalized.includes(service)) return service;
    }
    
    return null;
}

// Filter services based on platform and service keywords
function filterServices(services, platform, service) {
    if (!services || !services.length) return [];
    
    const platformLower = platform ? platform.toLowerCase() : null;
    const serviceLower = service ? service.toLowerCase() : null;
    
    // Get all keywords for the detected service
    let serviceKeywords = [];
    if (serviceLower && SERVICE_KEYWORDS[serviceLower]) {
        serviceKeywords = SERVICE_KEYWORDS[serviceLower];
    } else if (serviceLower) {
        // If service not in our map, use the service name itself as keyword
        serviceKeywords = [serviceLower];
    }
    
    const platformKeywords = platformLower ? PLATFORM_KEYWORDS[platformLower] || [platformLower] : null;
    
    return services.filter(svc => {
        const name = normalize(svc.name || "");
        
        // Platform must match if specified
        if (platformKeywords) {
            const hasPlatform = platformKeywords.some(kw => name.includes(kw));
            if (!hasPlatform) return false;
        }
        
        // Service must match if specified
        if (serviceKeywords.length > 0) {
            const hasService = serviceKeywords.some(kw => name.includes(kw));
            if (!hasService) return false;
        }
        
        return true;
    });
}

// Get 3 cheapest + 2 most expensive (total 5 services)
function getPriceExtremes(services) {
    if (!services.length) return [];
    if (services.length <= 5) return services;
    
    // Sort by price ascending
    const sorted = [...services].sort((a, b) => {
        const priceA = extractNumericPrice(a);
        const priceB = extractNumericPrice(b);
        if (isNaN(priceA) && isNaN(priceB)) return 0;
        if (isNaN(priceA)) return 1;
        if (isNaN(priceB)) return -1;
        return priceA - priceB;
    });
    
    const cheapest = sorted.slice(0, 3);
    const mostExpensive = sorted.slice(-2);
    
    // Combine and deduplicate
    const combined = [...cheapest, ...mostExpensive];
    const unique = combined.filter((svc, idx, self) =>
        idx === self.findIndex(s => s.service_id === svc.service_id)
    );
    
    return unique;
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
            const platform = detectPlatform(text);
            const service = detectService(text);

            console.log('\n📊 [QUERY ANALYSIS] ==================');
            console.log('📝 Query    :', text);
            console.log('📱 Platform :', platform || '❌ Not detected');
            console.log('🎯 Service  :', service || '❌ Not detected');
            console.log('======================================\n');

            // Filter services based on detection
            let filtered = filterServices(services, platform, service);

            // If no results with both, try platform only
            if (filtered.length === 0 && platform && service) {
                console.log(`ℹ️ No matches for ${platform} ${service}, showing all ${platform} services`);
                filtered = filterServices(services, platform, null);
            }
            
            // If still no results, try service only
            if (filtered.length === 0 && !platform && service) {
                console.log(`ℹ️ Showing all ${service} services`);
                filtered = filterServices(services, null, service);
            }

            // Final fallback - show some popular services
            if (filtered.length === 0) {
                console.log('ℹ️ No matches found, showing popular services');
                filtered = services.slice(0, 15);
            }

            // Get 3 cheapest + 2 most expensive
            const selectedServices = getPriceExtremes(filtered);

            // Build response
            let messageText = "╭━━━〔 🎯 *SMM SERVICES* 〕━━━━╮\n\n";

            if (platform) {
                const platformEmoji = {
                    tiktok: '🎵', instagram: '📷', facebook: '👤',
                    youtube: '▶️', whatsapp: '💬'
                }[platform] || '📱';
                messageText += `${platformEmoji} *Platform:* ${platform.toUpperCase()}\n`;
            }
            
            if (service) {
                const serviceEmoji = {
                    followers: '👥', subscribers: '📺', likes: '❤️',
                    views: '👀', comments: '💬', 'video views': '🎬',
                    'story views': '📖', 'post likes': '👍', 'page likes': '📄',
                    'channel members': '📢', 'live views': '🔴', 'watch time': '⏱️',
                    reposts: '🔄', saves: '🔖', 'group members': '👥',
                    'poll votes': '📊'
                }[service] || '🎯';
                messageText += `${serviceEmoji} *Service:* ${service.toUpperCase()}\n`;
            }
            
            messageText += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            selectedServices.forEach((svc, idx) => {
                messageText += createServiceItem(svc, idx) + "\n\n";
            });

            // Add helpful tip
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

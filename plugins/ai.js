const axios = require("axios");

let lkrToUsd = 0.0033;
let lkrToInr = 0.29;

// Exchange rate functions
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

// Helper functions
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

// Platform keywords
const PLATFORM_KEYWORDS = {
    tiktok: ['tiktok', 'tt', 'tik'],
    instagram: ['instagram', 'ig', 'insta'],
    facebook: ['facebook', 'fb'],
    youtube: ['youtube', 'yt'],
    whatsapp: ['whatsapp', 'wa']
};

// Service keywords for detection
const SERVICE_KEYWORDS = {
    followers: ['follower', 'followers', 'fans'],
    likes: ['like', 'likes', 'heart'],
    views: ['view', 'views', 'plays'],
    comments: ['comment', 'comments', 'reply'],
    shares: ['share', 'shares', 'repost'],
    saves: ['save', 'saves', 'bookmark'],
    story: ['story', 'stories'],
    live: ['live', 'stream'],
    channel: ['channel', 'members'],
    reactions: ['reaction', 'reactions', 'emoji'],
    subscribers: ['subscriber', 'subscribers', 'subs'],
    watchtime: ['watch time', 'watch hours', 'hours'],
    group: ['group', 'groups'],
    poll: ['poll', 'votes'],
    video: ['video', 'videos'],
    post: ['post', 'posts'],
    page: ['page', 'pages']
};

/**
 * Detect platform from query
 */
function detectPlatform(query) {
    const normalized = normalize(query);
    for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
        for (const keyword of keywords) {
            if (normalized.includes(keyword)) {
                return platform;
            }
        }
    }
    return null;
}

/**
 * Detect service type from query
 */
function detectService(query) {
    const normalized = normalize(query);
    
    // Check for multi-word services first
    const multiWordServices = [
        'watch time', 'watch hours'
    ];
    
    for (const service of multiWordServices) {
        if (normalized.includes(service)) return service.replace(' ', '');
    }
    
    // Check single-word services
    for (const [service, keywords] of Object.entries(SERVICE_KEYWORDS)) {
        for (const keyword of keywords) {
            if (normalized.includes(keyword)) {
                return service;
            }
        }
    }
    
    return null;
}

/**
 * Check if service is primarily about the requested type
 * This ensures the service name starts with the platform + service type
 */
function isPrimaryService(service, platform, serviceType) {
    const name = normalize(service.name || "");
    const platformKeywords = PLATFORM_KEYWORDS[platform] || [platform];
    const serviceKeywords = SERVICE_KEYWORDS[serviceType] || [serviceType];
    
    // Get the first 5 words of the service name
    const words = name.split(' ').slice(0, 5);
    const nameStart = words.join(' ');
    
    // Check if platform appears in first 2 words
    const hasPlatformEarly = platformKeywords.some(kw => 
        words.slice(0, 2).some(word => word.includes(kw) || kw.includes(word))
    );
    
    if (!hasPlatformEarly) return false;
    
    // Check if service type appears in first 4 words
    const hasServiceEarly = serviceKeywords.some(kw => 
        words.slice(0, 4).some(word => word.includes(kw) || kw.includes(word))
    );
    
    return hasServiceEarly;
}

/**
 * CATEGORY-BASED FILTERING with primary service check
 */
function filterByCategory(services, platform, service) {
    if (!services || !services.length) return [];
    
    const platformLower = platform ? platform.toLowerCase() : null;
    const serviceLower = service ? service.toLowerCase() : null;
    
    // Get platform keywords for matching
    const platformKeywords = platformLower ? PLATFORM_KEYWORDS[platformLower] || [platformLower] : null;
    
    // Get service keywords for matching
    let serviceKeywords = [];
    if (serviceLower && SERVICE_KEYWORDS[serviceLower]) {
        serviceKeywords = SERVICE_KEYWORDS[serviceLower];
    } else if (serviceLower) {
        serviceKeywords = [serviceLower];
    }
    
    // First pass: filter by category
    let categoryMatches = services.filter(svc => {
        const category = normalize(svc.category || "");
        
        // Platform must match in category
        if (platformKeywords) {
            const hasPlatformInCategory = platformKeywords.some(kw => category.includes(kw));
            if (!hasPlatformInCategory) return false;
        }
        
        // Service must match in category
        if (serviceKeywords.length > 0) {
            const hasServiceInCategory = serviceKeywords.some(kw => category.includes(kw));
            if (!hasServiceInCategory) return false;
        }
        
        return true;
    });
    
    // Second pass: ensure services are primary matches
    if (platformLower && serviceLower) {
        categoryMatches = categoryMatches.filter(svc => 
            isPrimaryService(svc, platformLower, serviceLower)
        );
    }
    
    return categoryMatches;
}

/**
 * Get 3 cheapest + 2 most expensive from PRIMARY services only
 */
function getPriceExtremes(services, platform, service) {
    if (!services.length) return [];
    
    // Further filter to ensure we only have primary services for the expensive ones
    const primaryServices = services.filter(svc => 
        isPrimaryService(svc, platform, service)
    );
    
    if (primaryServices.length <= 5) return primaryServices;
    
    // Sort by price ascending
    const sorted = [...primaryServices].sort((a, b) => {
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

/**
 * Fallback: Filter by service name if category filtering returns no results
 */
function filterByName(services, platform, service) {
    if (!services || !services.length) return [];
    
    const platformLower = platform ? platform.toLowerCase() : null;
    const serviceLower = service ? service.toLowerCase() : null;
    
    const platformKeywords = platformLower ? PLATFORM_KEYWORDS[platformLower] || [platformLower] : null;
    
    let serviceKeywords = [];
    if (serviceLower && SERVICE_KEYWORDS[serviceLower]) {
        serviceKeywords = SERVICE_KEYWORDS[serviceLower];
    } else if (serviceLower) {
        serviceKeywords = [serviceLower];
    }
    
    let nameMatches = services.filter(svc => {
        const name = normalize(svc.name || "");
        
        // Platform must match in name
        if (platformKeywords) {
            const hasPlatformInName = platformKeywords.some(kw => name.includes(kw));
            if (!hasPlatformInName) return false;
        }
        
        // Service must match in name
        if (serviceKeywords.length > 0) {
            const hasServiceInName = serviceKeywords.some(kw => name.includes(kw));
            if (!hasServiceInName) return false;
        }
        
        return true;
    });
    
    // Apply primary service check
    if (platformLower && serviceLower) {
        nameMatches = nameMatches.filter(svc => 
            isPrimaryService(svc, platformLower, serviceLower)
        );
    }
    
    return nameMatches;
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

            console.log('\n📊 [CATEGORY-BASED FILTERING] ==================');
            console.log('📝 Query    :', text);
            console.log('📱 Platform :', platform || '❌ Not detected');
            console.log('🎯 Service  :', service || '❌ Not detected');
            console.log('===============================================\n');

            if (!platform || !service) {
                // If missing platform or service, return a helpful message
                let helpText = "╭━━━〔 🎯 *SMM SERVICES* 〕━━━━╮\n\n";
                helpText += "❌ *Please specify both platform and service*\n\n";
                helpText += "📝 *Examples:*\n";
                helpText += "• instagram likes\n";
                helpText += "• tiktok followers\n";
                helpText += "• facebook page likes\n";
                helpText += "• youtube views\n";
                helpText += "• whatsapp channel\n\n";
                helpText += "📞 *Support:* wa.me/94722136082\n";
                helpText += "🌐 *Website:* https://makemetrend.online\n";
                helpText += "╰━━━━━━━━━━━━━━━━━━━━━━━━╯";
                
                await conn.sendMessage(from, { text: helpText }, { quoted: mek });
                return;
            }

            // PRIMARY METHOD: Filter by category (most accurate)
            let filtered = filterByCategory(services, platform, service);
            
            console.log(`🔍 Category filter: found ${filtered.length} primary ${service} services`);

            // FALLBACK METHOD: If no category matches, try filtering by name
            if (filtered.length === 0) {
                console.log(`ℹ️ No category matches for ${platform} ${service}, trying name filter`);
                filtered = filterByName(services, platform, service);
                console.log(`🔍 Name filter: found ${filtered.length} primary ${service} services`);
            }

            // Final fallback - show platform services
            if (filtered.length === 0) {
                console.log(`ℹ️ No primary ${service} services found, showing all ${platform} services`);
                filtered = filterByCategory(services, platform, null);
                if (filtered.length === 0) {
                    filtered = filterByName(services, platform, null);
                }
            }

            // Get 3 cheapest + 2 most expensive from PRIMARY services only
            const selectedServices = getPriceExtremes(filtered, platform, service);

            if (selectedServices.length === 0) {
                await conn.sendMessage(from, { 
                    text: `❌ No ${platform} ${service} services found. Please try a different combination.` 
                }, { quoted: mek });
                return;
            }

            // Build response
            let messageText = "╭━━━〔 🎯 *SMM SERVICES* 〕━━━━╮\n\n";

            const platformEmoji = {
                tiktok: '🎵', instagram: '📷', facebook: '👤',
                youtube: '▶️', whatsapp: '💬'
            }[platform] || '📱';
            
            const serviceEmoji = {
                followers: '👥', subscribers: '📺', likes: '❤️',
                views: '👀', comments: '💬', shares: '🔄',
                saves: '🔖', story: '📖', live: '🔴',
                channel: '📢', reactions: '😊', watchtime: '⏱️',
                group: '👥', poll: '📊', video: '🎬',
                post: '📝', page: '📄'
            }[service] || '🎯';
            
            messageText += `${platformEmoji} *Platform:* ${platform.toUpperCase()}\n`;
            messageText += `${serviceEmoji} *Service:* ${service.toUpperCase()}\n`;
            
            // Show category if available
            if (filtered.length > 0 && filtered[0].category) {
                const categoryName = filtered[0].category.split('[')[0].trim();
                messageText += `📁 *Category:* ${categoryName}\n`;
            }
            
            messageText += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            selectedServices.forEach((svc, idx) => {
                messageText += createServiceItem(svc, idx) + "\n\n";
            });

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

            console.log(`✅ [AI PLUGIN] Sent ${selectedServices.length} ${platform} ${service} services to ${from}`);
            
        } catch (err) {
            console.error("❌ [AI PLUGIN] Error:", err);
        }
    }
};

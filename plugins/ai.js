const axios = require("axios");

let lkrToUsd = 0.0033;
let lkrToInr = 0.29;

// Enhanced category filters based on your dropdown data
const CATEGORY_FILTERS = {
    // TikTok Categories
    'tiktok_followers': {
        platform   : 'tiktok',
        type       : 'followers',
        keywords   : ['tiktok followers', 'tt followers', 'tiktok foll', 'non drop followers', 'targeted followers', 'real followers tiktok', 'tiktok subs'],
        categoryIds: [1, 6, 8, 10, 12, 14, 127, 129, 131, 132, 133],
        subTypes   : ['non drop', 'targeted', 'real accounts', 'auto refill', 'with posts', 'saudi arabia']
    },
    'tiktok_likes': {
        platform   : 'tiktok',
        type       : 'likes',
        keywords   : ['tiktok likes', 'tt likes', 'tiktok lik', 'video likes', 'like tiktok', 'profile photos likes', 'hq likes', 'drop 0% likes'],
        categoryIds: [2, 3, 7, 15, 23, 128],
        subTypes   : ['profile photos', 'hq accounts', 'auto refill', 'drop 0%', 'super fast']
    },
    'tiktok_views': {
        platform   : 'tiktok',
        type       : 'views',
        keywords   : ['tiktok views', 'tt views', 'video views', 'tiktok vw', 'views tiktok', 'non drop views', 'best price views'],
        categoryIds: [4, 9, 13, 16, 20, 21, 121, 122, 133],
        subTypes   : ['non drop', 'auto refill', 'drop 0%', 'fast', 'cheapest']
    },
    'tiktok_comments': {
        platform   : 'tiktok',
        type       : 'comments',
        keywords   : ['tiktok comments', 'tt comments', 'video comments', 'comment tiktok'],
        categoryIds: [19, 24],
        subTypes   : ['custom comments', 'cheapest']
    },
    'tiktok_shares': {
        platform   : 'tiktok',
        type       : 'shares',
        keywords   : ['tiktok shares', 'tt shares', 'video shares', 'share tiktok', 'reposts'],
        categoryIds: [5, 18, 123],
        subTypes   : ['reposts', 'video share']
    },
    'tiktok_saves': {
        platform   : 'tiktok',
        type       : 'saves',
        keywords   : ['tiktok saves', 'tt saves', 'video saves', 'save tiktok'],
        categoryIds: [11, 17],
        subTypes   : ['video save']
    },
    'tiktok_live': {
        platform   : 'tiktok',
        type       : 'live',
        keywords   : ['tiktok live', 'tt live', 'live stream', 'live views', 'live likes', 'live share'],
        categoryIds: [25],
        subTypes   : ['live views', 'live likes', 'live share']
    },

    // Instagram Categories
    'instagram_followers': {
        platform   : 'instagram',
        type       : 'followers',
        keywords   : ['instagram followers', 'ig followers', 'insta followers', 'real followers ig', 'old accounts followers', 'growth followers'],
        categoryIds: [26, 27, 28, 35, 45, 46, 47, 48, 49, 126],
        subTypes   : ['real accounts', 'with posts', 'old accounts', 'cheapest', 'premium growth', 'lifetime', 'no refill']
    },
    'instagram_likes': {
        platform   : 'instagram',
        type       : 'likes',
        keywords   : ['instagram likes', 'ig likes', 'insta likes', 'post likes', 'real likes', 'active likes', 'old accounts likes'],
        categoryIds: [29, 30, 33, 38, 41, 42, 43, 44, 50, 124, 125],
        subTypes   : ['profile photos', 'real accounts', 'active accounts', 'old accounts', 'drop 0%', 'india', 'slow working', 'auto']
    },
    'instagram_views': {
        platform   : 'instagram',
        type       : 'views',
        keywords   : ['instagram views', 'ig views', 'insta views', 'video views', 'story views', 'reels views'],
        categoryIds: [31, 36, 51, 55],
        subTypes   : ['story views', 'targeted', 'video views', 'impression']
    },
    'instagram_comments': {
        platform   : 'instagram',
        type       : 'comments',
        keywords   : ['instagram comments', 'ig comments', 'insta comments', 'post comments', 'story comments'],
        categoryIds: [32, 34, 40, 52, 54],
        subTypes   : ['cheapest', 'recommended', 'best price', 'custom', 'story comments', 'verified']
    },
    'instagram_saves': {
        platform   : 'instagram',
        type       : 'saves',
        keywords   : ['instagram saves', 'ig saves', 'insta saves', 'post saves', 'save count'],
        categoryIds: [57],
        subTypes   : ['post saves']
    },
    'instagram_reposts': {
        platform   : 'instagram',
        type       : 'reposts',
        keywords   : ['instagram repost', 'ig repost', 'insta repost'],
        categoryIds: [53],
        subTypes   : ['repost']
    },
    'instagram_channel': {
        platform   : 'instagram',
        type       : 'channel',
        keywords   : ['instagram channel', 'ig channel', 'channel members', 'broadcast channel'],
        categoryIds: [58],
        subTypes   : ['targeted', 'cheapest']
    },
    'instagram_poll': {
        platform   : 'instagram',
        type       : 'poll',
        keywords   : ['instagram poll', 'ig poll', 'story poll', 'poll votes'],
        categoryIds: [56],
        subTypes   : ['poll votes']
    },
    'instagram_discovery': {
        platform   : 'instagram',
        type       : 'discovery',
        keywords   : ['instagram discovery', 'ig discovery', 'post discovery', 'discovery packages'],
        categoryIds: [37],
        subTypes   : ['provider', 'discovery packages']
    },

    // Facebook Categories
    'facebook_followers': {
        platform   : 'facebook',
        type       : 'followers',
        keywords   : ['facebook followers', 'fb followers', 'page followers', 'profile followers', 'hidden accounts followers'],
        categoryIds: [59, 62, 63, 64, 65, 74, 75],
        subTypes   : ['hidden accounts', 'cheapest', 'page likes', 'fast completed']
    },
    'facebook_likes': {
        platform   : 'facebook',
        type       : 'likes',
        keywords   : ['facebook likes', 'fb likes', 'post likes', 'page likes', 'reactions'],
        categoryIds: [60, 61, 65, 67, 73, 74, 76, 80],
        subTypes   : ['post likes', 'post reactions', 'page likes', 'guaranteed']
    },
    'facebook_views': {
        platform   : 'facebook',
        type       : 'views',
        keywords   : ['facebook views', 'fb views', 'video views', 'reels views', 'story views', 'live views'],
        categoryIds: [68, 70, 72, 77],
        subTypes   : ['live views', 'video views', 'story views', 'watch time']
    },
    'facebook_comments': {
        platform   : 'facebook',
        type       : 'comments',
        keywords   : ['facebook comments', 'fb comments', 'post comments', 'video comments'],
        categoryIds: [69, 79],
        subTypes   : ['best price', 'cheapest']
    },
    'facebook_story': {
        platform   : 'facebook',
        type       : 'story',
        keywords   : ['facebook story', 'fb story', 'story reactions', 'story views'],
        categoryIds: [71, 77, 78],
        subTypes   : ['story reactions', 'story views']
    },
    'facebook_group': {
        platform   : 'facebook',
        type       : 'group',
        keywords   : ['facebook group', 'fb group', 'group members'],
        categoryIds: [66],
        subTypes   : ['group members']
    },

    // YouTube Categories
    'youtube_views': {
        platform   : 'youtube',
        type       : 'views',
        keywords   : ['youtube views', 'yt views', 'video views', 'shorts views', 'adwords views', 'real views'],
        categoryIds: [81, 82, 93, 96, 97, 98, 105, 106],
        subTypes   : ['best', 'recommended', 'adwords', 'real quality', 'ctr search', 'native ads']
    },
    'youtube_subscribers': {
        platform   : 'youtube',
        type       : 'subscribers',
        keywords   : ['youtube subscribers', 'yt subscribers', 'subs', 'channel subscribers', 'real subscribers'],
        categoryIds: [88, 91, 107, 108, 109, 115],
        subTypes   : ['fastest', 'real', 'targeted', 'organic']
    },
    'youtube_comments': {
        platform   : 'youtube',
        type       : 'comments',
        keywords   : ['youtube comments', 'yt comments', 'video comments', 'shorts comments', 'ai comments', 'custom comments'],
        categoryIds: [83, 85, 87, 111],
        subTypes   : ['custom', 'ai generated', 'live chat', 'reply comments']
    },
    'youtube_comment_likes': {
        platform   : 'youtube',
        type       : 'comment_likes',
        keywords   : ['youtube comment likes', 'yt comment likes', 'reply likes', 'comment likes'],
        categoryIds: [84, 86, 112],
        subTypes   : ['reply likes', 'comment likes']
    },
    'youtube_watch_time': {
        platform   : 'youtube',
        type       : 'watch_time',
        keywords   : ['youtube watch time', 'yt watch time', 'watch hours', 'watch minutes', 'watchtime'],
        categoryIds: [89, 94, 102, 103, 104],
        subTypes   : ['watch hours', 'google ads', 'stabil']
    },
    'youtube_live': {
        platform   : 'youtube',
        type       : 'live',
        keywords   : ['youtube live', 'yt live', 'live stream', 'live views', 'live chat', 'live reaction'],
        categoryIds: [87, 95, 113, 114],
        subTypes   : ['live views', 'live chat', 'live reaction', 'concurrent']
    },
    'youtube_shares': {
        platform   : 'youtube',
        type       : 'shares',
        keywords   : ['youtube shares', 'yt shares', 'video shares', 'shorts shares'],
        categoryIds: [99, 100, 101],
        subTypes   : ['choose speed', 'choose geo', 'choose referrer']
    },
    'youtube_hype': {
        platform   : 'youtube',
        type       : 'hype',
        keywords   : ['youtube hype', 'yt hype', 'hype boost'],
        categoryIds: [92],
        subTypes   : ['hype boost']
    },

    // WhatsApp Categories
    'whatsapp_channel': {
        platform   : 'whatsapp',
        type       : 'channel',
        keywords   : ['whatsapp channel', 'wa channel', 'channel members', 'channel followers', 'whatsapp followers'],
        categoryIds: [116, 117, 118],
        subTypes   : ['cheapest', 'targeted']
    },
    'whatsapp_reactions': {
        platform   : 'whatsapp',
        type       : 'reactions',
        keywords   : ['whatsapp reactions', 'wa reactions', 'emoji reactions', 'channel reactions', 'update reactions'],
        categoryIds: [119, 120],
        subTypes   : ['cheap slow', 'complete in 1 minute']
    }
};

/**
 * Update exchange rates from API
 */
async function updateExchangeRates() {
    try {
        const usdResponse = await axios.get("https://api.exchangerate.host/latest?base=LKR&symbols=USD");
        if (usdResponse.data?.rates?.USD) {
            lkrToUsd = usdResponse.data.rates.USD;
            console.log(`💱 [MMT BUSINESS HUB] Updated LKR→USD rate: ${lkrToUsd}`);
        }
        
        const inrResponse = await axios.get("https://api.exchangerate.host/latest?base=LKR&symbols=INR");
        if (inrResponse.data?.rates?.INR) {
            lkrToInr = inrResponse.data.rates.INR;
            console.log(`💱 [MMT BUSINESS HUB] Updated LKR→INR rate: ${lkrToInr}`);
        }
    } catch (err) {
        console.error("⚠️ [MMT BUSINESS HUB] Failed to fetch exchange rates:", err.message);
    }
}

// Initial update and interval
updateExchangeRates();
setInterval(updateExchangeRates, 12 * 60 * 60 * 1000);

/**
 * Extract LKR price from price string
 * @param {string} priceStr 
 * @returns {number}
 */
function extractLKRPrice(priceStr) {
    if (!priceStr) return 0;
    
    const match = priceStr.match(/(?:Rs\.?|LKR)?\s*([\d,.]+)/i);
    if (match) {
        const cleaned = match[1].replace(/,/g, '');
        return parseFloat(cleaned);
    }
    
    return 0;
}

/**
 * Convert LKR to other currencies
 * @param {number} priceInLKR 
 * @returns {object|null}
 */
function convertFromLKR(priceInLKR) {
    if (!priceInLKR || isNaN(priceInLKR)) return null;
    
    const usdValue = priceInLKR * lkrToUsd;
    const inrValue = priceInLKR * lkrToInr;
    
    return {
        lkr: priceInLKR,
        usd: usdValue,
        inr: inrValue
    };
}

/**
 * Format number with two decimals
 * @param {number} num 
 * @returns {string}
 */
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

/**
 * Format LKR price
 * @param {number} price 
 * @returns {string}
 */
function formatLKRPrice(price) {
    if (price === null || isNaN(price)) return "0";
    
    const numStr = price.toString();
    
    if (numStr.includes('.')) {
        const [intPart, decPart] = numStr.split('.');
        const allDecimals = decPart;
        const intNum = parseInt(intPart);
        const formattedInt = intNum >= 1000 ? intNum.toLocaleString() : intPart;
        
        if (parseFloat(`0.${allDecimals}`) > 0) {
            return `${formattedInt}.${allDecimals}`;
        }
        return formattedInt;
    } else {
        const intNum = parseInt(numStr);
        return intNum >= 1000 ? intNum.toLocaleString() : numStr;
    }
}

/**
 * Format price display for service
 * @param {object} service 
 * @returns {string}
 */
function formatPriceDisplay(service) {
    const lkrPrice = extractLKRPrice(service.price);
    const converted = convertFromLKR(lkrPrice);
    
    if (!converted) return "Price not available";
    
    const perMatch = service.price.match(/per\s*([\d,.]+k?)/i);
    const perText = perMatch ? ` per ${perMatch[1]}` : "";
    
    const lkrFormatted = formatLKRPrice(converted.lkr);
    
    return `┌─ 💰 *Price Details*\n` +
           `│ 📍 LKR: Rs. ${lkrFormatted}${perText}\n` +
           `│ 💵 USD: $${formatWithTwoDecimals(converted.usd)}${perText}\n` +
           `│ 🆔 Service ID: ${service.service_id}\n` +
           `└────────────`;
}

/**
 * Convert number to emoji
 * @param {number} num 
 * @returns {string}
 */
function numberToEmoji(num) {
    const emojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
    return String(num).split("").map(d => emojis[parseInt(d)] || d).join("");
}

/**
 * Normalize text for comparison
 * @param {string} text 
 * @returns {string}
 */
function normalize(text) {
    return text.toLowerCase()
               .replace(/[^a-z0-9\s]/g, "")
               .replace(/\s+/g, " ")
               .trim();
}

/**
 * Extract numeric price from service
 * @param {object} service 
 * @returns {number}
 */
function extractNumericPrice(service) {
    return extractLKRPrice(service.price);
}

/**
 * Enhanced detection function using category filters
 * @param {string} query 
 * @returns {object}
 */
function detectServiceDetails(query) {
    const normalized = normalize(query);
    const detected = {
        platform   : null,
        type       : null,
        subType    : null,
        categoryIds: [],
        confidence : 0
    };
    
    let bestMatch     = null;
    let highestConfidence = 0;
    
    for (const [key, category] of Object.entries(CATEGORY_FILTERS)) {
        // Check main keywords
        for (const keyword of category.keywords) {
            if (normalized.includes(keyword)) {
                const confidence = keyword.length / normalized.length;
                if (confidence > highestConfidence) {
                    highestConfidence = confidence;
                    bestMatch = category;
                    detected.subType = category.subTypes.find(st => normalized.includes(st.toLowerCase())) || null;
                }
                break;
            }
        }
        
        // Check subTypes
        if (!bestMatch) {
            for (const subType of category.subTypes) {
                if (normalized.includes(subType.toLowerCase())) {
                    const confidence = 0.7; // Good confidence for subtype matches
                    if (confidence > highestConfidence) {
                        highestConfidence = confidence;
                        bestMatch = category;
                        detected.subType = subType;
                    }
                    break;
                }
            }
        }
    }
    
    if (bestMatch) {
        detected.platform    = bestMatch.platform;
        detected.type        = bestMatch.type;
        detected.categoryIds = bestMatch.categoryIds;
        detected.confidence  = highestConfidence;
    }
    
    return detected;
}

/**
 * Filter services by category IDs
 * @param {array} services 
 * @param {array} categoryIds 
 * @returns {array}
 */
function filterServicesByCategory(services, categoryIds) {
    if (!services || !services.length || !categoryIds.length) return services;
    
    return services.filter(service => {
        // Check if service category matches any of the categoryIds
        // You'll need to adjust this based on how your service data structure looks
        // This assumes services have a category_id field
        return categoryIds.includes(service.category_id) || 
               categoryIds.some(id => service.category?.includes(id) || service.name?.includes(id));
    });
}

/**
 * Filter services by platform and type
 * @param {array} services 
 * @param {string} platform 
 * @param {string} serviceType 
 * @returns {array}
 */
function filterServicesByType(services, platform, serviceType) {
    if (!services || !services.length) return [];
    
    const normalizedPlatform = platform ? normalize(platform) : '';
    const normalizedType     = serviceType ? normalize(serviceType) : '';
    
    return services.filter(service => {
        const name     = normalize(service.name);
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

/**
 * Get top services (lowest prices + highest)
 * @param {array} services 
 * @returns {array}
 */
function getTopServices(services) {
    if (!services || services.length === 0) return [];
    
    const sorted = [...services].sort((a, b) => {
        const priceA = extractNumericPrice(a);
        const priceB = extractNumericPrice(b);
        return priceA - priceB;
    });
    
    const lowest  = sorted.slice(0, 3);
    const highest = sorted.slice(-2);
    
    const combined = [...lowest, ...highest];
    const unique   = combined.filter((service, index, self) => 
        index === self.findIndex(s => s.service_id === service.service_id)
    );
    
    return unique;
}

/**
 * Create service item display
 * @param {object} service 
 * @param {number} index 
 * @returns {string}
 */
function createServiceItem(service, index) {
    const emoji        = numberToEmoji(index + 1);
    const priceDisplay = formatPriceDisplay(service);
    
    return `${emoji} *${service.name}*\n` +
           `${priceDisplay}\n` +
           `📦 Min: ${service.min} | Max: ${service.max}\n` +
           `🔗 https://makemetrend.online/services\n` +
           `────────────────────`;
}

// Constants
const channelJid   = '120363423526129509@newsletter';
const channelName  = 'ミ★ 𝙈𝙈𝙏 𝘽𝙐𝙎𝙄𝙉𝙀𝙎𝙎 𝙃𝙐𝘽 ★彡';
const serviceLogo  = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/download.png?raw=true";

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            const key     = mek.key;
            const content = mek.message;
            
            if (!content || key.fromMe) return;

            const text = content.conversation || 
                        content.extendedTextMessage?.text || 
                        content.imageMessage?.caption || 
                        content.videoMessage?.caption || 
                        content.documentMessage?.caption || "";
            
            if (!text.trim()) return;

            const msg  = text.toLowerCase();
            const from = key.remoteJid;

            // Enhanced service keywords including all platforms and types
            const serviceKeywords = [
                "price", "service", "cost", "purchase", "order", "rate", "charges",
                "facebook", "fb", "instagram", "ig", "youtube", "yt", "tiktok", "tt", "telegram",
                "whatsapp", "wa", "social media", "marketing", "followers", "fans", "subs",
                "likes", "views", "comments", "shares", "reposts", "saves", "reactions",
                "live", "stream", "watch time", "hours", "members", "channel"
            ];
            
            const isServiceQuery = serviceKeywords.some(k => msg.includes(k));
            if (!isServiceQuery) return;

            await conn.sendPresenceUpdate('composing', from);
            
            try { 
                await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } }); 
            } catch {}

            let services;
            try { 
                services = await global.mmtServices.getServices(); 
                if (!services?.length) return; 
            } catch { 
                return; 
            }

            // Use enhanced detection
            const detected     = detectServiceDetails(text);
            const platform     = detected.platform || detectPlatform(text);
            const serviceType  = detected.type || detectServiceType(text);
            
            console.log(`[MMT BUSINESS HUB] Detected: Platform=${platform}, Type=${serviceType}, SubType=${detected.subType}, Confidence=${detected.confidence}`);

            let filtered = [];
            
            // First try filtering by category IDs if we have them
            if (detected.categoryIds.length > 0) {
                filtered = filterServicesByCategory(services, detected.categoryIds);
            }
            
            // If no results from category filter, fall back to keyword filtering
            if (filtered.length === 0) {
                filtered = filterServicesByType(services, platform, serviceType);
            }
            
            // If still no results, try platform only
            if (filtered.length === 0 && platform) {
                filtered = filterServicesByType(services, platform, null);
            }
            
            // If still no results, try type only
            if (filtered.length === 0 && serviceType) {
                filtered = filterServicesByType(services, null, serviceType);
            }

            if (filtered.length === 0) return;

            const selectedServices = getTopServices(filtered);

            let messageText = "╭━━━〔 🎯 *MATCHING SERVICES* 〕\n\n";
            
            if (platform) {
                messageText += `📱 *Platform:* ${platform.toUpperCase()}\n`;
            }
            if (serviceType) {
                messageText += `🎯 *Service:* ${serviceType.toUpperCase()}\n`;
            }
            if (detected.subType) {
                messageText += `✨ *Type:* ${detected.subType.toUpperCase()}\n`;
            }
            messageText += `━━━━━━━━━━━━━━━━━━━━\n\n`;

            selectedServices.forEach((service, index) => {
                messageText += createServiceItem(service, index) + "\n\n";
            });

            messageText += `📞 *Support:* wa.me/94722136082\n`;
            messageText += `🌐 *Website:* https://makemetrend.online\n`;
            messageText += `╰━━━━━━━━━━━━━━━━━━━━╯`;

            await conn.sendMessage(from, {
                image : { url: serviceLogo },
                caption: messageText,
                contextInfo: { 
                    forwardingScore              : 999, 
                    isForwarded                  : true, 
                    forwardedNewsletterMessageInfo: { 
                        newsletterJid : channelJid, 
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

// Keep original detection functions as fallbacks
function detectPlatform(query) {
    const normalized = normalize(query);
    
    const platforms = {
        'instagram': ['instagram', 'ig', 'insta'],
        'facebook' : ['facebook', 'fb', 'meta'],
        'tiktok'   : ['tiktok', 'tt'],
        'youtube'  : ['youtube', 'yt', 'tube'],
        'telegram' : ['telegram', 'tg'],
        'twitter'  : ['twitter', 'twt', 'x'],
        'whatsapp' : ['whatsapp', 'wa']
    };
    
    for (const [platform, keywords] of Object.entries(platforms)) {
        if (keywords.some(k => normalized.includes(k))) {
            return platform;
        }
    }
    
    return null;
}

function detectServiceType(query) {
    const normalized = normalize(query);
    
    const types = {
        'followers'  : ['follower', 'followers', 'foll', 'subscriber', 'subscribers', 'fans'],
        'likes'      : ['like', 'likes', 'lik'],
        'views'      : ['view', 'views', 'vw'],
        'comments'   : ['comment', 'comments', 'cmt'],
        'shares'     : ['share', 'shares'],
        'reactions'  : ['reaction', 'reactions'],
        'saves'      : ['save', 'saves'],
        'reposts'    : ['repost', 'reposts'],
        'live'       : ['live', 'stream'],
        'watch_time' : ['watch time', 'watchtime', 'hours', 'minutes'],
        'channel'    : ['channel', 'members']
    };
    
    for (const [type, keywords] of Object.entries(types)) {
        if (keywords.some(k => normalized.includes(k))) {
            return type;
        }
    }
    
    return 'followers';
}

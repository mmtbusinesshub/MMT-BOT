const axios = require("axios");

let lkrToUsd = 0.0033;
let lkrToInr = 0.29;

// Platform-specific default services (when only platform is mentioned)
const PLATFORM_DEFAULTS = {
    tiktok: {
        primary: 'followers',
        secondary: 'likes',
        available: ['followers', 'likes', 'views', 'comments', 'shares', 'saves', 'live']
    },
    instagram: {
        primary: 'followers',
        secondary: 'likes',
        available: ['followers', 'likes', 'views', 'comments', 'saves', 'story', 'channel', 'poll']
    },
    facebook: {
        primary: 'followers',
        secondary: 'likes',
        available: ['followers', 'likes', 'views', 'comments', 'story', 'group']
    },
    youtube: {
        primary: 'views',
        secondary: 'subscribers',
        available: ['views', 'subscribers', 'likes', 'comments', 'watchtime', 'live', 'shares']
    },
    whatsapp: {
        primary: 'channel',
        secondary: 'reactions',
        available: ['channel', 'reactions']
    }
};

// Service type keywords with platform-specific variations
const SERVICE_KEYWORDS = {
    followers: {
        keywords: ['follower', 'followers', 'fans', 'audience'],
        platforms: ['tiktok', 'instagram', 'facebook'],
        priority: 1
    },
    subscribers: {
        keywords: ['subscriber', 'subscribers', 'subs', 'channel subscribers'],
        platforms: ['youtube'],
        priority: 1
    },
    likes: {
        keywords: ['like', 'likes', 'heart', 'hearts', 'reaction', 'reactions', 'thumbs', 'love'],
        platforms: ['tiktok', 'instagram', 'facebook', 'youtube'],
        priority: 2
    },
    views: {
        keywords: ['view', 'views', 'plays', 'watch', 'video views', 'reels views', 'impressions'],
        platforms: ['tiktok', 'instagram', 'facebook', 'youtube'],
        priority: 2
    },
    comments: {
        keywords: ['comment', 'comments', 'reply', 'replies', 'chat', 'message'],
        platforms: ['tiktok', 'instagram', 'facebook', 'youtube'],
        priority: 3
    },
    shares: {
        keywords: ['share', 'shares', 'repost', 'reposts', 'forward', 'forwards'],
        platforms: ['tiktok', 'instagram', 'facebook', 'youtube'],
        priority: 3
    },
    saves: {
        keywords: ['save', 'saves', 'bookmark', 'bookmarks', 'archive'],
        platforms: ['tiktok', 'instagram'],
        priority: 3
    },
    story: {
        keywords: ['story', 'stories', 'story views', 'story likes', 'story reactions'],
        platforms: ['instagram', 'facebook'],
        priority: 2
    },
    live: {
        keywords: ['live', 'stream', 'live stream', 'live views', 'live likes', 'live chat'],
        platforms: ['tiktok', 'youtube', 'facebook'],
        priority: 3
    },
    channel: {
        keywords: ['channel', 'channel members', 'broadcast', 'broadcast channel'],
        platforms: ['instagram', 'whatsapp'],
        priority: 2
    },
    reactions: {
        keywords: ['reaction', 'reactions', 'emoji', 'emojis'],
        platforms: ['whatsapp'],
        priority: 2
    },
    watchtime: {
        keywords: ['watch time', 'watch hours', 'watchtime', 'hours', 'watch minutes', 'retention'],
        platforms: ['youtube'],
        priority: 2
    },
    group: {
        keywords: ['group', 'group members', 'group join', 'join group'],
        platforms: ['facebook'],
        priority: 3
    },
    poll: {
        keywords: ['poll', 'poll votes', 'voting', 'vote'],
        platforms: ['instagram'],
        priority: 3
    }
};

// Platform keywords with variations
const PLATFORM_KEYWORDS = {
    tiktok: ['tiktok', 'tt', 'tik tok', 'tick tock'],
    instagram: ['instagram', 'ig', 'insta', 'igram'],
    facebook: ['facebook', 'fb', 'meta', 'face book'],
    youtube: ['youtube', 'yt', 'tube', 'you tube'],
    whatsapp: ['whatsapp', 'wa', 'whats app']
};

/**
 * Update exchange rates from API
 */
async function updateExchangeRates() {
    try {
        const usdResponse = await axios.get("https://api.exchangerate.host/latest?base=LKR&symbols=USD");
        if (usdResponse.data?.rates?.USD) {
            lkrToUsd = usdResponse.data.rates.USD;
            console.log(`💱 [AI PLUGIN] Updated LKR→USD rate: ${lkrToUsd}`);
        }
        
        const inrResponse = await axios.get("https://api.exchangerate.host/latest?base=LKR&symbols=INR");
        if (inrResponse.data?.rates?.INR) {
            lkrToInr = inrResponse.data.rates.INR;
            console.log(`💱 [AI PLUGIN] Updated LKR→INR rate: ${lkrToInr}`);
        }
    } catch (err) {
        console.error("⚠️ [AI PLUGIN] Failed to fetch exchange rates:", err.message);
    }
}

updateExchangeRates();
setInterval(updateExchangeRates, 12 * 60 * 60 * 1000);

/**
 * Extract LKR price from price string (FIXED)
 */
function extractLKRPrice(priceStr) {
    if (!priceStr) return 0;
    
    // Convert to string if it's a number
    const priceString = String(priceStr);
    
    const match = priceString.match(/(?:Rs\.?|LKR)?\s*([\d,.]+)/i);
    if (match) {
        const cleaned = match[1].replace(/,/g, '');
        return parseFloat(cleaned);
    }
    
    return 0;
}

/**
 * Convert LKR to other currencies
 */
function convertFromLKR(priceInLKR) {
    if (!priceInLKR || isNaN(priceInLKR)) return null;
    return {
        lkr: priceInLKR,
        usd: priceInLKR * lkrToUsd,
        inr: priceInLKR * lkrToInr
    };
}

/**
 * Format number with two decimals
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
 */
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

/**
 * Format price display for service (FIXED)
 */
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

/**
 * Convert number to emoji
 */
function numberToEmoji(num) {
    const emojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
    return String(num).split("").map(d => emojis[parseInt(d)] || d).join("");
}

/**
 * Normalize text for comparison
 */
function normalize(text) {
    return text.toLowerCase()
               .replace(/[^\w\s]/g, ' ')
               .replace(/\s+/g, ' ')
               .trim();
}

/**
 * Extract numeric price from service (FIXED)
 */
function extractNumericPrice(service) {
    return extractLKRPrice(service.price);
}

/**
 * SMART SMM DETECTION ENGINE - IMPROVED with keyword length scoring
 */
function detectSMMService(query) {
    const normalized = normalize(query);
    
    let detected = {
        platform: null,
        service: null,
        confidence: 0,
        matchType: 'none',
        platformKeyword: '',
        serviceKeyword: ''
    };

    // Platform detection with scoring
    let bestPlatform = null;
    let bestPlatformScore = 0;
    let bestPlatformKeyword = '';

    for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
        for (const keyword of keywords) {
            if (normalized.includes(keyword)) {
                // Compute score: length + standalone bonus
                let score = keyword.length;
                // Check if standalone
                const keywordIndex = normalized.indexOf(keyword);
                const prevChar = keywordIndex > 0 ? normalized[keywordIndex - 1] : ' ';
                const nextChar = keywordIndex + keyword.length < normalized.length ? 
                    normalized[keywordIndex + keyword.length] : ' ';
                if (prevChar === ' ' && nextChar === ' ') {
                    score += 10; // standalone bonus
                }
                if (score > bestPlatformScore) {
                    bestPlatformScore = score;
                    bestPlatform = platform;
                    bestPlatformKeyword = keyword;
                }
            }
        }
    }

    // Service detection with scoring
    let bestService = null;
    let bestServiceScore = 0;
    let bestServiceKeyword = '';

    for (const [serviceType, config] of Object.entries(SERVICE_KEYWORDS)) {
        for (const keyword of config.keywords) {
            if (normalized.includes(keyword)) {
                let score = keyword.length;
                const keywordIndex = normalized.indexOf(keyword);
                const prevChar = keywordIndex > 0 ? normalized[keywordIndex - 1] : ' ';
                const nextChar = keywordIndex + keyword.length < normalized.length ? 
                    normalized[keywordIndex + keyword.length] : ' ';
                if (prevChar === ' ' && nextChar === ' ') {
                    score += 10;
                }
                // Bonus if platform detected and service available on that platform
                if (bestPlatform && config.platforms.includes(bestPlatform)) {
                    score += 5;
                }
                if (score > bestServiceScore) {
                    bestServiceScore = score;
                    bestService = serviceType;
                    bestServiceKeyword = keyword;
                }
            }
        }
    }

    detected.platform = bestPlatform;
    detected.service = bestService;
    detected.confidence = Math.max(bestPlatformScore, bestServiceScore) / 100; // rough normalization
    detected.platformKeyword = bestPlatformKeyword;
    detected.serviceKeyword = bestServiceKeyword;

    // Determine match type and apply smart conversions
    if (bestPlatform && bestService) {
        // Check if service is compatible with platform, convert if needed
        const serviceConfig = SERVICE_KEYWORDS[bestService];
        if (serviceConfig && !serviceConfig.platforms.includes(bestPlatform)) {
            console.log(`⚠️ Service ${bestService} not available for ${bestPlatform}`);
            // Smart conversion
            if (bestService === 'followers' && bestPlatform === 'youtube') {
                bestService = 'subscribers';
                console.log(`🔄 Converted followers → subscribers for YouTube`);
            } else if (bestService === 'subscribers' && bestPlatform !== 'youtube') {
                bestService = 'followers';
                console.log(`🔄 Converted subscribers → followers for ${bestPlatform}`);
            } else {
                const defaults = PLATFORM_DEFAULTS[bestPlatform];
                bestService = defaults.primary;
                console.log(`🔄 Falling back to ${bestPlatform} default: ${defaults.primary}`);
            }
            detected.service = bestService;
        }
        detected.matchType = 'combined';
    } else if (bestPlatform && !bestService) {
        const defaults = PLATFORM_DEFAULTS[bestPlatform];
        bestService = defaults.primary;
        detected.service = bestService;
        detected.matchType = 'platform-only';
        console.log(`📌 Platform-only query for ${bestPlatform}, using default: ${defaults.primary}`);
    } else if (!bestPlatform && bestService) {
        const serviceConfig = SERVICE_KEYWORDS[bestService];
        if (serviceConfig && serviceConfig.platforms.length === 1) {
            bestPlatform = serviceConfig.platforms[0];
            detected.platform = bestPlatform;
            detected.matchType = 'service-specific';
            console.log(`📌 Service-specific query: ${bestService} → ${bestPlatform}`);
        } else {
            detected.matchType = 'service-only-multi';
            console.log(`📌 Service-only query: ${bestService} (multiple platforms)`);
        }
    }

    return detected;
}


/**
 * SERVICE CLASSIFIER - identifies all service types in a service name
 */
function classifyService(service) {
    const name = normalize(service.name || "");
    
    const patterns = {
        followers: /\bfollowers?\b/,
        subscribers: /\bsubscribers?\b|\bsubs\b/,
        likes: /\blikes?\b/,
        views: /\bviews?\b/,
        comments: /\bcomments?\b/,
        shares: /\bshares?\b|\breposts?\b/,
        saves: /\bsaves?\b|\bbookmark\b/,
        story: /\bstory\b/,
        live: /\blive\b|\bstream\b/,
        reactions: /\breactions?\b|\bemoji\b/,
        channel: /\bchannel\b/,
        watchtime: /\bwatch\s?time\b|\bhours\b/,
        group: /\bgroup\b/,
        poll: /\bpoll\b|\bvote\b/
    };

    let matched = [];

    for (const [type, regex] of Object.entries(patterns)) {
        if (regex.test(name)) {
            matched.push(type);
        }
    }

    return matched;
}


/**
 * SMART FILTERING SYSTEM - now allows multiple types per service
 */
function filterServices(services, platform, serviceType) {
    if (!services || !services.length) return [];

    const platformLower = platform ? platform.toLowerCase() : '';
    const serviceLower = serviceType ? serviceType.toLowerCase() : '';

    const platformVariations = {
        'tiktok': ['tiktok', 'tt'],
        'instagram': ['instagram', 'ig', 'insta'],
        'facebook': ['facebook', 'fb'],
        'youtube': ['youtube', 'yt'],
        'whatsapp': ['whatsapp', 'wa']
    };

    const platformKeywords = platformVariations[platformLower] || [platformLower];

    return services.filter(service => {
        const nameLower = normalize(service.name || "");
        const categoryLower = normalize(service.category || "");

        /* ---------------- PLATFORM MATCH ---------------- */
        let platformMatch = true;

        if (platformLower) {
            platformMatch = platformKeywords.some(keyword =>
                nameLower.includes(keyword) || categoryLower.includes(keyword)
            );
        }

        if (!platformMatch) return false;

        /* ---------------- SERVICE MATCH ---------------- */
        if (!serviceLower) return platformMatch;

        const classifiedTypes = classifyService(service);

        // Must contain requested type (allow multiple types)
        if (!classifiedTypes.includes(serviceLower)) {
            return false;
        }

        // YouTube followers → subscribers auto handling
        if (platformLower === "youtube" && serviceLower === "followers") {
            return false;
        }

        // All variations are accepted as long as they contain the requested type
        return true;
    });
}

/**
 * Get appropriate services based on query type
 */
function getAppropriateServices(services, detected) {
    if (!services || !services.length) return [];
    
    let filtered = [];
    
    // CASE 1: Platform + Service detected
    if (detected.platform && detected.service) {
        filtered = filterServices(services, detected.platform, detected.service);
        console.log(`🔍 Filtering for ${detected.platform} ${detected.service}: found ${filtered.length} services`);
    }
    
    // CASE 2: Platform only
    else if (detected.platform && !detected.service) {
        filtered = filterServices(services, detected.platform, null);
        console.log(`🔍 Filtering for ${detected.platform} only: found ${filtered.length} services`);
    }
    
    // CASE 3: Service only
    else if (!detected.platform && detected.service) {
        filtered = filterServices(services, null, detected.service);
        console.log(`🔍 Filtering for ${detected.service} only: found ${filtered.length} services`);
    }
    
    return filtered;
}

/**
 * Get diverse set of services covering all available service types
 */
function getDiverseServices(services, maxResults = 10) {
    if (!services || services.length === 0) return [];
    if (services.length <= maxResults) return services;

    // Group by primary service type (first matched type)
    const groups = new Map(); // type -> cheapest service of that type

    services.forEach(service => {
        const types = classifyService(service);
        if (types.length === 0) return; // skip if no type detected (should not happen)
        const primaryType = types[0]; // take first as primary
        const price = extractNumericPrice(service);
        if (!groups.has(primaryType) || price < extractNumericPrice(groups.get(primaryType))) {
            groups.set(primaryType, service);
        }
    });

    // Also collect most expensive overall (top 2 by price) to show premium options
    const sortedByPriceDesc = [...services].sort((a, b) => extractNumericPrice(b) - extractNumericPrice(a));
    const mostExpensive = sortedByPriceDesc.slice(0, 2);

    // Combine unique services from groups and most expensive
    const unique = new Map();
    groups.forEach((service, type) => unique.set(service.service_id, service));
    mostExpensive.forEach(service => unique.set(service.service_id, service));

    let result = Array.from(unique.values());

    // If we have fewer than maxResults, add more from original list (cheapest remaining)
    if (result.length < maxResults) {
        const remaining = services
            .filter(s => !unique.has(s.service_id))
            .sort((a, b) => extractNumericPrice(a) - extractNumericPrice(b));
        result = result.concat(remaining.slice(0, maxResults - result.length));
    }

    // Sort result by price ascending for display
    return result.sort((a, b) => extractNumericPrice(a) - extractNumericPrice(b));
}

/**
 * Create service item display
 */
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

            // Use smart SMM detection
            const detected = detectSMMService(text);
            
            console.log('\n📊 [SMM DETECTION] ==================');
            console.log('📝 Query    :', text);
            console.log('📱 Platform :', detected.platform || '❌ Not detected', detected.platformKeyword ? `(via: ${detected.platformKeyword})` : '');
            console.log('🎯 Service  :', detected.service || '❌ Not detected', detected.serviceKeyword ? `(via: ${detected.serviceKeyword})` : '');
            console.log('📊 Confidence:', (detected.confidence * 100).toFixed(1) + '%');
            console.log('🔍 Match Type:', detected.matchType);
            console.log('=====================================\n');

            // Get appropriate services based on detection
            let filtered = getAppropriateServices(services, detected);
            
            // If still no results, show platform services as fallback
            if (filtered.length === 0 && detected.platform) {
                console.log(`ℹ️ No specific matches for ${detected.platform} ${detected.service}, showing all ${detected.platform} services`);
                filtered = filterServices(services, detected.platform, null);
            }
            
            // Final fallback - show some services
            if (filtered.length === 0) {
                console.log('ℹ️ No matches found, showing popular services');
                filtered = services.slice(0, 15);
            }

            // Get diverse set of services to display all categories
            const selectedServices = getDiverseServices(filtered, 10);

            // Build response message
            let messageText = "╭━━━〔 🎯 *SMM SERVICES* 〕━━━━╮\n\n";
            
            // Add detection summary
            if (detected.platform) {
                const platformEmoji = {
                    'tiktok': '🎵',
                    'instagram': '📷',
                    'facebook': '👤',
                    'youtube': '▶️',
                    'whatsapp': '💬'
                }[detected.platform] || '📱';
                
                messageText += `${platformEmoji} *Platform:* ${detected.platform.toUpperCase()}\n`;
            }
            
            if (detected.service) {
                const serviceEmoji = {
                    'followers': '👥',
                    'subscribers': '📺',
                    'likes': '❤️',
                    'views': '👀',
                    'comments': '💬',
                    'shares': '🔄',
                    'saves': '🔖',
                    'story': '📖',
                    'live': '🔴',
                    'channel': '📢',
                    'reactions': '😊',
                    'watchtime': '⏱️',
                    'group': '👥',
                    'poll': '📊'
                }[detected.service] || '🎯';
                
                messageText += `${serviceEmoji} *Service:* ${detected.service.toUpperCase()}\n`;
            }
            
            // Add match type info
            if (detected.matchType === 'platform-only') {
                messageText += `✨ *Showing:* Various ${detected.platform} services\n`;
            } else if (detected.matchType === 'service-only-multi') {
                messageText += `✨ *Showing:* ${detected.service} services from all platforms\n`;
            }
            
            messageText += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            selectedServices.forEach((service, index) => {
                messageText += createServiceItem(service, index) + "\n\n";
            });

            // Add suggestion for better results
            if (detected.matchType === 'platform-only') {
                messageText += `💡 *Tip:* Be more specific! Try "${detected.platform} likes" or "${detected.platform} views"\n\n`;
            } else if (detected.matchType === 'service-only-multi') {
                messageText += `💡 *Tip:* Add a platform name like "instagram ${detected.service}" or "tiktok ${detected.service}"\n\n`;
            }

            messageText += `📞 *Support:* wa.me/94722136082\n`;
            messageText += `🌐 *Website:* https://makemetrend.online\n`;
            messageText += `╰━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            // Send response
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

            console.log(`✅ [AI PLUGIN] Sent ${selectedServices.length} services to ${from} (${detected.matchType})`);
            
        } catch (err) {
            console.error("❌ [AI PLUGIN] Error:", err);
        }
    }
};

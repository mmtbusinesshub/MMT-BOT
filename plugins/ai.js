const axios = require("axios");

let lkrToUsd = 0.0033;
let lkrToInr = 0.29;

// Professional SMM Panel Keyword Categories with exact matching
const SMM_CATEGORIES = {
    // ==================== TIKTOK SERVICES ====================
    tiktok: {
        followers: {
            primary   : ['tiktok followers', 'tt followers', 'tiktok fans', 'tiktok subs'],
            exact     : ['tiktok follower', 'followers for tiktok', 'buy tiktok followers'],
            exclude   : ['instagram', 'facebook', 'youtube', 'likes', 'views'], // Exclude other platforms & types
            categoryId: [1, 6, 8, 10, 12, 14, 127, 129, 131, 132],
            response  : 'tiktok_followers'
        },
        likes: {
            primary   : ['tiktok likes', 'tt likes', 'tiktok heart', 'video likes tiktok'],
            exact     : ['likes for tiktok', 'buy tiktok likes', 'tiktok post likes'],
            exclude   : ['instagram', 'facebook', 'youtube', 'followers', 'views'],
            categoryId: [2, 3, 7, 15, 23, 128],
            response  : 'tiktok_likes'
        },
        views: {
            primary   : ['tiktok views', 'tt views', 'tiktok video views', 'tiktok plays'],
            exact     : ['views for tiktok', 'buy tiktok views', 'tiktok video plays'],
            exclude   : ['instagram', 'facebook', 'youtube', 'followers', 'likes'],
            categoryId: [4, 9, 13, 16, 20, 21, 121, 122, 133],
            response  : 'tiktok_views'
        },
        comments: {
            primary   : ['tiktok comments', 'tt comments', 'tiktok comment'],
            exact     : ['comments for tiktok', 'buy tiktok comments'],
            exclude   : ['instagram', 'facebook', 'youtube', 'followers', 'likes', 'views'],
            categoryId: [19, 24],
            response  : 'tiktok_comments'
        },
        shares: {
            primary   : ['tiktok shares', 'tt shares', 'tiktok share', 'tiktok repost'],
            exact     : ['shares for tiktok', 'buy tiktok shares'],
            exclude   : ['instagram', 'facebook', 'youtube', 'followers', 'likes', 'views'],
            categoryId: [5, 18, 123],
            response  : 'tiktok_shares'
        },
        saves: {
            primary   : ['tiktok saves', 'tt saves', 'tiktok save', 'tiktok bookmark'],
            exact     : ['saves for tiktok', 'buy tiktok saves'],
            exclude   : ['instagram', 'facebook', 'youtube', 'followers', 'likes', 'views'],
            categoryId: [11, 17],
            response  : 'tiktok_saves'
        },
        live: {
            primary   : ['tiktok live', 'tt live', 'tiktok live stream', 'tiktok live views'],
            exact     : ['live views for tiktok', 'tiktok live stream views'],
            exclude   : ['instagram', 'facebook', 'youtube', 'followers', 'likes', 'views'],
            categoryId: [25],
            response  : 'tiktok_live'
        }
    },

    // ==================== INSTAGRAM SERVICES ====================
    instagram: {
        followers: {
            primary   : ['instagram followers', 'ig followers', 'insta followers', 'ig fans'],
            exact     : ['followers for instagram', 'buy instagram followers', 'increase instagram followers'],
            exclude   : ['tiktok', 'facebook', 'youtube', 'likes', 'views', 'story'],
            categoryId: [26, 27, 28, 35, 45, 46, 47, 48, 49, 126],
            response  : 'instagram_followers'
        },
        likes: {
            primary   : ['instagram likes', 'ig likes', 'insta likes', 'post likes instagram'],
            exact     : ['likes for instagram', 'buy instagram likes', 'instagram post likes'],
            exclude   : ['tiktok', 'facebook', 'youtube', 'followers', 'views', 'story'],
            categoryId: [29, 30, 33, 38, 41, 42, 43, 44, 50, 124, 125],
            response  : 'instagram_likes'
        },
        views: {
            primary   : ['instagram views', 'ig views', 'insta views', 'video views instagram', 'reels views'],
            exact     : ['views for instagram', 'buy instagram views', 'instagram video views'],
            exclude   : ['tiktok', 'facebook', 'youtube', 'followers', 'likes', 'story'],
            categoryId: [31, 36, 51, 55],
            response  : 'instagram_views'
        },
        story: {  // SPECIFIC STORY CATEGORY
            primary   : ['instagram story', 'ig story', 'insta story', 'story views', 'story reactions'],
            exact     : ['story views', 'instagram story views', 'story likes', 'story reactions'],
            exclude   : ['tiktok', 'facebook', 'youtube', 'followers', 'post', 'reels', 'video'],
            categoryId: [31, 36, 51], // Story-specific category IDs
            response  : 'instagram_story'
        },
        comments: {
            primary   : ['instagram comments', 'ig comments', 'insta comments', 'post comments'],
            exact     : ['comments for instagram', 'buy instagram comments'],
            exclude   : ['tiktok', 'facebook', 'youtube', 'followers', 'likes', 'views', 'story'],
            categoryId: [32, 34, 40, 52, 54],
            response  : 'instagram_comments'
        },
        saves: {
            primary   : ['instagram saves', 'ig saves', 'insta saves', 'post saves'],
            exact     : ['saves for instagram', 'buy instagram saves'],
            exclude   : ['tiktok', 'facebook', 'youtube', 'followers', 'likes', 'views', 'story'],
            categoryId: [57],
            response  : 'instagram_saves'
        },
        channel: {
            primary   : ['instagram channel', 'ig channel', 'broadcast channel', 'channel members'],
            exact     : ['instagram channel members', 'ig broadcast channel'],
            exclude   : ['tiktok', 'facebook', 'youtube', 'followers', 'likes', 'views', 'story'],
            categoryId: [58],
            response  : 'instagram_channel'
        },
        poll: {
            primary   : ['instagram poll', 'ig poll', 'story poll', 'poll votes'],
            exact     : ['poll votes for instagram', 'instagram story poll'],
            exclude   : ['tiktok', 'facebook', 'youtube', 'followers', 'likes', 'views'],
            categoryId: [56],
            response  : 'instagram_poll'
        }
    },

    // ==================== FACEBOOK SERVICES ====================
    facebook: {
        followers: {
            primary   : ['facebook followers', 'fb followers', 'page followers', 'profile followers'],
            exact     : ['followers for facebook', 'buy facebook followers'],
            exclude   : ['instagram', 'tiktok', 'youtube', 'likes', 'views', 'story'],
            categoryId: [59, 62, 63, 64, 65, 74, 75],
            response  : 'facebook_followers'
        },
        likes: {
            primary   : ['facebook likes', 'fb likes', 'post likes', 'page likes', 'reactions'],
            exact     : ['likes for facebook', 'buy facebook likes', 'facebook post reactions'],
            exclude   : ['instagram', 'tiktok', 'youtube', 'followers', 'views', 'story'],
            categoryId: [60, 61, 65, 67, 73, 74, 76, 80],
            response  : 'facebook_likes'
        },
        views: {
            primary   : ['facebook views', 'fb views', 'video views', 'reels views', 'live views'],
            exact     : ['views for facebook', 'buy facebook views', 'facebook video views'],
            exclude   : ['instagram', 'tiktok', 'youtube', 'followers', 'likes', 'story'],
            categoryId: [68, 70, 72, 77],
            response  : 'facebook_views'
        },
        story: {
            primary   : ['facebook story', 'fb story', 'story views', 'story reactions'],
            exact     : ['facebook story views', 'fb story reactions'],
            exclude   : ['instagram', 'tiktok', 'youtube', 'followers', 'likes', 'post'],
            categoryId: [71, 77, 78],
            response  : 'facebook_story'
        },
        comments: {
            primary   : ['facebook comments', 'fb comments', 'post comments'],
            exact     : ['comments for facebook', 'buy facebook comments'],
            exclude   : ['instagram', 'tiktok', 'youtube', 'followers', 'likes', 'views'],
            categoryId: [69, 79],
            response  : 'facebook_comments'
        },
        group: {
            primary   : ['facebook group', 'fb group', 'group members'],
            exact     : ['facebook group members', 'fb group join'],
            exclude   : ['instagram', 'tiktok', 'youtube', 'followers', 'likes', 'views'],
            categoryId: [66],
            response  : 'facebook_group'
        }
    },

    // ==================== YOUTUBE SERVICES ====================
    youtube: {
        subscribers: {
            primary   : ['youtube subscribers', 'yt subscribers', 'youtube subs', 'channel subscribers'],
            exact     : ['subscribers for youtube', 'buy youtube subscribers', 'increase youtube subs'],
            exclude   : ['instagram', 'facebook', 'tiktok', 'likes', 'views', 'comments'],
            categoryId: [88, 91, 107, 108, 109, 115],
            response  : 'youtube_subscribers'
        },
        views: {
            primary   : ['youtube views', 'yt views', 'video views', 'shorts views'],
            exact     : ['views for youtube', 'buy youtube views', 'youtube video views'],
            exclude   : ['instagram', 'facebook', 'tiktok', 'followers', 'likes', 'comments'],
            categoryId: [81, 82, 93, 96, 97, 98, 105, 106],
            response  : 'youtube_views'
        },
        likes: {
            primary   : ['youtube likes', 'yt likes', 'video likes', 'thumbs up'],
            exact     : ['likes for youtube', 'buy youtube likes', 'youtube video likes'],
            exclude   : ['instagram', 'facebook', 'tiktok', 'followers', 'views', 'comments'],
            categoryId: [110],
            response  : 'youtube_likes'
        },
        comments: {
            primary   : ['youtube comments', 'yt comments', 'video comments'],
            exact     : ['comments for youtube', 'buy youtube comments'],
            exclude   : ['instagram', 'facebook', 'tiktok', 'followers', 'likes', 'views'],
            categoryId: [83, 85, 87, 111],
            response  : 'youtube_comments'
        },
        watchtime: {
            primary   : ['youtube watch time', 'watch hours', 'yt watchtime', 'watch minutes'],
            exact     : ['youtube watch hours', 'increase watch time', 'buy watch hours'],
            exclude   : ['instagram', 'facebook', 'tiktok', 'followers', 'likes', 'views'],
            categoryId: [89, 94, 102, 103, 104],
            response  : 'youtube_watchtime'
        },
        live: {
            primary   : ['youtube live', 'yt live', 'live stream', 'live views'],
            exact     : ['youtube live views', 'live stream views', 'youtube live chat'],
            exclude   : ['instagram', 'facebook', 'tiktok', 'followers', 'likes', 'views'],
            categoryId: [87, 95, 113, 114],
            response  : 'youtube_live'
        },
        shares: {
            primary   : ['youtube shares', 'yt shares', 'video shares'],
            exact     : ['shares for youtube', 'buy youtube shares'],
            exclude   : ['instagram', 'facebook', 'tiktok', 'followers', 'likes', 'views'],
            categoryId: [99, 100, 101],
            response  : 'youtube_shares'
        }
    },

    // ==================== WHATSAPP SERVICES ====================
    whatsapp: {
        channel: {
            primary   : ['whatsapp channel', 'wa channel', 'channel members', 'whatsapp followers'],
            exact     : ['whatsapp channel members', 'wa channel join', 'channel followers'],
            exclude   : ['instagram', 'facebook', 'tiktok', 'youtube', 'likes', 'views'],
            categoryId: [116, 117, 118],
            response  : 'whatsapp_channel'
        },
        reactions: {
            primary   : ['whatsapp reactions', 'wa reactions', 'emoji reactions', 'channel reactions'],
            exact     : ['whatsapp channel reactions', 'wa emoji reactions'],
            exclude   : ['instagram', 'facebook', 'tiktok', 'youtube', 'followers', 'likes'],
            categoryId: [119, 120],
            response  : 'whatsapp_reactions'
        }
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
 * Extract numeric price from service
 */
function extractNumericPrice(service) {
    return extractLKRPrice(service.price);
}

/**
 * PROFESSIONAL SMM DETECTION ENGINE
 * Accurately detects platform and service type from user query
 */
function detectSMMService(query) {
    const normalized = normalize(query);
    const words = normalized.split(' ');
    
    let detected = {
        platform   : null,
        service    : null,
        categoryIds: [],
        confidence : 0,
        matchType  : 'none'
    };

    // First, check for exact matches (highest priority)
    for (const [platform, services] of Object.entries(SMM_CATEGORIES)) {
        for (const [serviceType, config] of Object.entries(services)) {
            // Check exact phrases
            for (const exact of config.exact) {
                if (normalized.includes(exact)) {
                    // Check exclusion words
                    const hasExclude = config.exclude.some(ex => normalized.includes(ex));
                    if (!hasExclude) {
                        return {
                            platform   : platform,
                            service    : serviceType,
                            categoryIds: config.categoryId,
                            confidence : 1.0,
                            matchType  : 'exact',
                            response   : config.response
                        };
                    }
                }
            }
        }
    }

    // If no exact match, check primary keywords with exclusion
    for (const [platform, services] of Object.entries(SMM_CATEGORIES)) {
        for (const [serviceType, config] of Object.entries(services)) {
            for (const keyword of config.primary) {
                if (normalized.includes(keyword)) {
                    // Check if query contains ANY exclude words
                    const hasExclude = config.exclude.some(ex => normalized.includes(ex));
                    
                    if (!hasExclude) {
                        // Calculate confidence based on keyword length match
                        const confidence = keyword.length / normalized.length;
                        
                        // Only accept if confidence is reasonable
                        if (confidence > 0.3) {
                            return {
                                platform   : platform,
                                service    : serviceType,
                                categoryIds: config.categoryId,
                                confidence : confidence,
                                matchType  : 'primary',
                                response   : config.response
                            };
                        }
                    }
                }
            }
        }
    }

    // Last resort: Check if platform and service are mentioned separately
    let mentionedPlatforms = [];
    let mentionedServices = [];
    
    for (const [platform, services] of Object.entries(SMM_CATEGORIES)) {
        const platformKeywords = [platform, 
                                 platform === 'instagram' ? 'ig' : '',
                                 platform === 'instagram' ? 'insta' : '',
                                 platform === 'facebook' ? 'fb' : '',
                                 platform === 'youtube' ? 'yt' : '',
                                 platform === 'tiktok' ? 'tt' : '',
                                 platform === 'whatsapp' ? 'wa' : ''].filter(Boolean);
        
        if (platformKeywords.some(k => words.includes(k))) {
            mentionedPlatforms.push(platform);
        }
        
        // Check for service types
        for (const [serviceType, config] of Object.entries(services)) {
            if (config.primary.some(k => words.includes(k.split(' ')[0]))) {
                mentionedServices.push({platform, serviceType, config});
            }
        }
    }

    // If we have both platform and service mentioned
    if (mentionedPlatforms.length === 1 && mentionedServices.length > 0) {
        const platform = mentionedPlatforms[0];
        const serviceMatch = mentionedServices.find(s => s.platform === platform);
        
        if (serviceMatch) {
            return {
                platform   : platform,
                service    : serviceMatch.serviceType,
                categoryIds: serviceMatch.config.categoryId,
                confidence : 0.6,
                matchType  : 'combined',
                response   : serviceMatch.config.response
            };
        }
    }

    return detected;
}

/**
 * Filter services by category IDs with platform validation
 */
function filterServicesByCategory(services, categoryIds, platform) {
    if (!services || !services.length || !categoryIds.length) return [];
    
    return services.filter(service => {
        // Check if service belongs to correct platform
        const nameLower = service.name.toLowerCase();
        const platformMatch = !platform || nameLower.includes(platform);
        
        // Check category ID match
        const categoryMatch = categoryIds.includes(service.category_id) ||
                             categoryIds.some(id => service.category?.includes(id));
        
        return platformMatch && categoryMatch;
    });
}

/**
 * Filter services by type (fallback)
 */
function filterServicesByType(services, platform, serviceType) {
    if (!services || !services.length) return [];
    
    return services.filter(service => {
        const name = service.name.toLowerCase();
        const category = (service.category || '').toLowerCase();
        
        const platformMatch = !platform || 
            name.includes(platform) || 
            category.includes(platform);
        
        const typeMatch = !serviceType || 
            name.includes(serviceType) || 
            category.includes(serviceType);
        
        return platformMatch && typeMatch;
    });
}

/**
 * Get top services (lowest 3, highest 2)
 */
function getTopServices(services) {
    if (!services || services.length === 0) return [];
    
    const sorted = [...services].sort((a, b) => {
        const priceA = extractNumericPrice(a);
        const priceB = extractNumericPrice(b);
        return priceA - priceB;
    });
    
    const lowest = sorted.slice(0, Math.min(3, sorted.length));
    const highest = sorted.length > 3 ? sorted.slice(-2) : [];
    
    const combined = [...lowest, ...highest];
    const unique = combined.filter((service, index, self) => 
        index === self.findIndex(s => s.service_id === service.service_id)
    );
    
    return unique;
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
const channelJid   = '120363423526129509@newsletter';
const channelName  = 'ミ★ 𝙈𝙈𝙏 𝘽𝙐𝙎𝙄𝙉𝙀𝙎𝙎 𝙃𝙐𝘽 ★彡';
const serviceLogo  = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/download.png?raw=true";

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
                'reaction', 'live', 'stream', 'subscriber', 'member', 'channel'
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

            // Use professional SMM detection
            const detected = detectSMMService(text);
            
            console.log('📊 [SMM DETECTION] ==================');
            console.log('Query    :', text);
            console.log('Platform :', detected.platform);
            console.log('Service  :', detected.service);
            console.log('Confidence:', detected.confidence);
            console.log('Match Type:', detected.matchType);
            console.log('Category IDs:', detected.categoryIds);
            console.log('=====================================');

            let filtered = [];
            let responseType = '';

            // If we have confident detection
            if (detected.confidence >= 0.3 && detected.categoryIds.length > 0) {
                filtered = filterServicesByCategory(services, detected.categoryIds, detected.platform);
                responseType = `${detected.platform}_${detected.service}`;
            }

            // Fallback to platform+type detection
            if (filtered.length === 0 && detected.platform) {
                filtered = filterServicesByType(services, detected.platform, detected.service);
                responseType = `${detected.platform}_${detected.service || 'general'}`;
            }

            // Final fallback - platform only
            if (filtered.length === 0 && detected.platform) {
                filtered = filterServicesByType(services, detected.platform, null);
                responseType = `${detected.platform}_general`;
            }

            // No results found
            if (filtered.length === 0) {
                console.log('❌ No services found for query');
                return;
            }

            // Get top services to display
            const selectedServices = getTopServices(filtered);

            // Build response message
            let messageText = "╭━━━〔 🎯 *SMM SERVICES* 〕━━━━╮\n\n";
            
            if (detected.platform) {
                const platformEmoji = {
                    'tiktok'   : '🎵',
                    'instagram': '📷',
                    'facebook' : '👤',
                    'youtube'  : '▶️',
                    'whatsapp' : '💬'
                }[detected.platform] || '📱';
                
                messageText += `${platformEmoji} *Platform:* ${detected.platform.toUpperCase()}\n`;
            }
            
            if (detected.service) {
                const serviceEmoji = {
                    'followers' : '👥',
                    'likes'     : '❤️',
                    'views'     : '👀',
                    'comments'  : '💬',
                    'shares'    : '🔄',
                    'saves'     : '🔖',
                    'story'     : '📖',
                    'live'      : '🔴',
                    'channel'   : '📢',
                    'reactions' : '😊',
                    'subscribers': '📺',
                    'watchtime' : '⏱️'
                }[detected.service] || '🎯';
                
                messageText += `${serviceEmoji} *Service:* ${detected.service.toUpperCase()}\n`;
            }
            
            messageText += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            selectedServices.forEach((service, index) => {
                messageText += createServiceItem(service, index) + "\n\n";
            });

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

            console.log(`✅ [MMT BUSINESS HUB] Sent ${selectedServices.length} ${responseType} services to ${from}`);
            
        } catch (err) {
            console.error("❌ [MMT BUSINESS HUB] AI plugin error:", err);
        }
    }
};

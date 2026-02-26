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
        platforms: ['tiktok', 'instagram', 'facebook']
    },
    subscribers: {
        keywords: ['subscriber', 'subscribers', 'subs', 'channel subscribers'],
        platforms: ['youtube']
    },
    likes: {
        keywords: ['like', 'likes', 'heart', 'hearts', 'reaction', 'reactions', 'thumbs', 'love'],
        platforms: ['tiktok', 'instagram', 'facebook', 'youtube']
    },
    views: {
        keywords: ['view', 'views', 'plays', 'watch', 'video views', 'reels views', 'impressions'],
        platforms: ['tiktok', 'instagram', 'facebook', 'youtube']
    },
    comments: {
        keywords: ['comment', 'comments', 'reply', 'replies', 'chat', 'message'],
        platforms: ['tiktok', 'instagram', 'facebook', 'youtube']
    },
    shares: {
        keywords: ['share', 'shares', 'repost', 'reposts', 'forward', 'forwards'],
        platforms: ['tiktok', 'instagram', 'facebook', 'youtube']
    },
    saves: {
        keywords: ['save', 'saves', 'bookmark', 'bookmarks', 'archive'],
        platforms: ['tiktok', 'instagram']
    },
    story: {
        keywords: ['story', 'stories', 'story views', 'story likes', 'story reactions'],
        platforms: ['instagram', 'facebook']
    },
    live: {
        keywords: ['live', 'stream', 'live stream', 'live views', 'live likes', 'live chat'],
        platforms: ['tiktok', 'youtube', 'facebook']
    },
    channel: {
        keywords: ['channel', 'channel members', 'broadcast', 'broadcast channel'],
        platforms: ['instagram', 'whatsapp']
    },
    reactions: {
        keywords: ['reaction', 'reactions', 'emoji', 'emojis'],
        platforms: ['whatsapp']
    },
    watchtime: {
        keywords: ['watch time', 'watch hours', 'watchtime', 'hours', 'watch minutes', 'retention'],
        platforms: ['youtube']
    },
    group: {
        keywords: ['group', 'group members', 'group join', 'join group'],
        platforms: ['facebook']
    },
    poll: {
        keywords: ['poll', 'poll votes', 'voting', 'vote'],
        platforms: ['instagram']
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
 * SMART SMM DETECTION ENGINE
 * Intelligently detects platform and service type from user query
 */
function detectSMMService(query) {
    const normalized = normalize(query);
    const words = normalized.split(' ');
    
    let detected = {
        platform: null,
        service: null,
        confidence: 0,
        matchType: 'none',
        isExactMatch: false
    };

    // STEP 1: Detect platform first
    let detectedPlatform = null;
    let platformConfidence = 0;
    
    for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
        for (const keyword of keywords) {
            if (normalized.includes(keyword)) {
                // Check if it's an exact word match or part of phrase
                if (words.includes(keyword) || normalized.includes(` ${keyword} `)) {
                    detectedPlatform = platform;
                    platformConfidence = 1.0;
                    break;
                } else if (normalized.includes(keyword)) {
                    detectedPlatform = platform;
                    platformConfidence = 0.8;
                    break;
                }
            }
        }
        if (detectedPlatform) break;
    }

    // STEP 2: Detect service type
    let detectedService = null;
    let serviceConfidence = 0;
    let matchedServiceType = null;
    let matchedKeyword = '';

    for (const [serviceType, config] of Object.entries(SERVICE_KEYWORDS)) {
        for (const keyword of config.keywords) {
            if (normalized.includes(keyword)) {
                // Check if this service type is available for detected platform
                if (detectedPlatform) {
                    if (config.platforms.includes(detectedPlatform)) {
                        // Platform-specific service match
                        const confidence = keyword.length / normalized.length;
                        if (confidence > serviceConfidence) {
                            serviceConfidence = confidence;
                            matchedServiceType = serviceType;
                            matchedKeyword = keyword;
                        }
                    }
                } else {
                    // No platform detected yet, store potential service
                    const confidence = keyword.length / normalized.length;
                    if (confidence > serviceConfidence) {
                        serviceConfidence = confidence;
                        matchedServiceType = serviceType;
                        matchedKeyword = keyword;
                    }
                }
            }
        }
    }

    detectedService = matchedServiceType;

    // STEP 3: Handle platform-only queries
    if (detectedPlatform && !detectedService) {
        // User mentioned only platform name
        const defaults = PLATFORM_DEFAULTS[detectedPlatform];
        detectedService = defaults.primary;
        serviceConfidence = 0.7;
        detected.matchType = 'platform-only';
        
        console.log(`📌 Platform-only query for ${detectedPlatform}, using default: ${defaults.primary}`);
    }
    
    // STEP 4: Handle service-only queries (no platform mentioned)
    else if (!detectedPlatform && detectedService) {
        // User mentioned service type but no platform
        // Find which platforms support this service
        const serviceConfig = SERVICE_KEYWORDS[detectedService];
        if (serviceConfig && serviceConfig.platforms.length > 0) {
            // If service is specific to one platform (like subscribers for YouTube)
            if (serviceConfig.platforms.length === 1) {
                detectedPlatform = serviceConfig.platforms[0];
                serviceConfidence = 0.8;
                detected.matchType = 'service-specific';
                console.log(`📌 Service-specific query: ${detectedService} → ${detectedPlatform}`);
            } else {
                // Multiple platforms support this service, we'll need to show all
                detected.matchType = 'service-only-multi';
                console.log(`📌 Service-only query: ${detectedService} (multiple platforms)`);
            }
        }
    }
    
    // STEP 5: Handle combined platform+service queries
    else if (detectedPlatform && detectedService) {
        // Verify service is available for this platform
        const serviceConfig = SERVICE_KEYWORDS[detectedService];
        if (serviceConfig && !serviceConfig.platforms.includes(detectedPlatform)) {
            // Service not available for this platform, adjust
            console.log(`⚠️ Service ${detectedService} not available for ${detectedPlatform}`);
            
            // Try to find equivalent service
            if (detectedService === 'followers' && detectedPlatform === 'youtube') {
                detectedService = 'subscribers';
                console.log(`🔄 Converted followers → subscribers for YouTube`);
            } else {
                // Fall back to platform default
                const defaults = PLATFORM_DEFAULTS[detectedPlatform];
                detectedService = defaults.primary;
                console.log(`🔄 Falling back to ${detectedPlatform} default: ${defaults.primary}`);
            }
        }
        detected.matchType = 'combined';
    }

    // Set final confidence
    detected.platform = detectedPlatform;
    detected.service = detectedService;
    detected.confidence = Math.max(platformConfidence, serviceConfidence);

    return detected;
}

/**
 * Filter services based on platform and service type
 */
function filterServices(services, platform, serviceType) {
    if (!services || !services.length) return [];
    
    const platformLower = platform ? platform.toLowerCase() : '';
    const serviceLower = serviceType ? serviceType.toLowerCase() : '';
    
    // Service type synonyms mapping
    const serviceSynonyms = {
        'followers': ['followers', 'fans'],
        'subscribers': ['subscribers', 'subs'],
        'likes': ['likes', 'hearts', 'reactions'],
        'views': ['views', 'plays'],
        'comments': ['comments'],
        'shares': ['shares', 'reposts'],
        'saves': ['saves', 'bookmarks'],
        'story': ['story', 'stories'],
        'live': ['live', 'stream'],
        'channel': ['channel'],
        'reactions': ['reactions', 'emojis'],
        'watchtime': ['watch time', 'hours'],
        'group': ['group'],
        'poll': ['poll']
    };
    
    const searchTerms = [];
    
    // Add platform to search terms
    if (platformLower) {
        searchTerms.push(platformLower);
        // Add platform variations
        if (platformLower === 'instagram') searchTerms.push('ig', 'insta');
        if (platformLower === 'facebook') searchTerms.push('fb');
        if (platformLower === 'youtube') searchTerms.push('yt');
        if (platformLower === 'tiktok') searchTerms.push('tt');
        if (platformLower === 'whatsapp') searchTerms.push('wa');
    }
    
    // Add service type to search terms
    if (serviceLower) {
        const synonyms = serviceSynonyms[serviceLower] || [serviceLower];
        searchTerms.push(...synonyms);
    }
    
    // Filter services
    return services.filter(service => {
        const nameLower = service.name.toLowerCase();
        const categoryLower = (service.category || '').toLowerCase();
        
        // Check if service name/category contains ALL required terms
        const matchesPlatform = !platformLower || 
            searchTerms.some(term => nameLower.includes(term) || categoryLower.includes(term));
        
        // For service type, we need at least one service term match
        const matchesService = !serviceLower || 
            searchTerms.some(term => nameLower.includes(term) || categoryLower.includes(term));
        
        return matchesPlatform && matchesService;
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
        
        // If no results, try platform + synonyms
        if (filtered.length === 0) {
            console.log(`⚠️ No exact matches for ${detected.platform} ${detected.service}, trying broader search...`);
            filtered = filterServices(services, detected.platform, null);
        }
    }
    
    // CASE 2: Platform only
    else if (detected.platform && !detected.service) {
        filtered = filterServices(services, detected.platform, null);
    }
    
    // CASE 3: Service only (multiple platforms)
    else if (!detected.platform && detected.service) {
        filtered = filterServices(services, null, detected.service);
    }
    
    return filtered;
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
            console.log('📱 Platform :', detected.platform || '❌ Not detected');
            console.log('🎯 Service  :', detected.service || '❌ Not detected');
            console.log('📊 Confidence:', (detected.confidence * 100).toFixed(1) + '%');
            console.log('🔍 Match Type:', detected.matchType);
            console.log('=====================================\n');

            // Get appropriate services based on detection
            let filtered = getAppropriateServices(services, detected);
            
            // If still no results, show popular services as fallback
            if (filtered.length === 0) {
                console.log('ℹ️ No specific matches, showing popular services');
                filtered = services.slice(0, 10);
                detected.matchType = 'fallback-popular';
            }

            // Get top services to display
            const selectedServices = getTopServices(filtered);

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
                messageText += `✨ *Showing:* Popular ${detected.platform} services\n`;
            } else if (detected.matchType === 'service-only-multi') {
                messageText += `✨ *Showing:* ${detected.service} services from all platforms\n`;
            }
            
            messageText += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            selectedServices.forEach((service, index) => {
                messageText += createServiceItem(service, index) + "\n\n";
            });

            // Add suggestion for better results
            if (detected.matchType === 'platform-only') {
                messageText += `💡 *Tip:* Be more specific! Try "instagram likes" or "tiktok views"\n\n`;
            } else if (detected.matchType === 'service-only-multi') {
                messageText += `💡 *Tip:* Add a platform name like "instagram ${detected.service}"\n\n`;
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

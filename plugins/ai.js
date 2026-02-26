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
 * SMART SMM DETECTION ENGINE - IMPROVED
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

    // STEP 1: Detect platform with higher priority
    let detectedPlatform = null;
    let platformConfidence = 0;
    let platformKeyword = '';
    
    for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
        for (const keyword of keywords) {
            if (normalized.includes(keyword)) {
                // Check if it's a standalone word or part of phrase
                const keywordIndex = normalized.indexOf(keyword);
                const prevChar = keywordIndex > 0 ? normalized[keywordIndex - 1] : ' ';
                const nextChar = keywordIndex + keyword.length < normalized.length ? 
                    normalized[keywordIndex + keyword.length] : ' ';
                
                // Check if keyword is standalone (surrounded by spaces or boundaries)
                if (prevChar === ' ' && nextChar === ' ') {
                    detectedPlatform = platform;
                    platformConfidence = 1.0;
                    platformKeyword = keyword;
                    break;
                } else if (platformConfidence < 0.8) {
                    detectedPlatform = platform;
                    platformConfidence = 0.8;
                    platformKeyword = keyword;
                }
            }
        }
        if (detectedPlatform && platformConfidence === 1.0) break;
    }

    // STEP 2: Detect service type with improved matching
    let detectedService = null;
    let serviceConfidence = 0;
    let matchedServiceType = null;
    let matchedKeyword = '';

    for (const [serviceType, config] of Object.entries(SERVICE_KEYWORDS)) {
        for (const keyword of config.keywords) {
            if (normalized.includes(keyword)) {
                // Check if it's an exact match for the service
                const keywordIndex = normalized.indexOf(keyword);
                const prevChar = keywordIndex > 0 ? normalized[keywordIndex - 1] : ' ';
                const nextChar = keywordIndex + keyword.length < normalized.length ? 
                    normalized[keywordIndex + keyword.length] : ' ';
                
                let confidence = 0;
                
                // Higher confidence for standalone keywords
                if (prevChar === ' ' && nextChar === ' ') {
                    confidence = 0.9;
                } else {
                    confidence = 0.6;
                }
                
                // Boost confidence if platform is also detected and matches
                if (detectedPlatform && config.platforms.includes(detectedPlatform)) {
                    confidence += 0.2;
                }
                
                if (confidence > serviceConfidence) {
                    serviceConfidence = confidence;
                    matchedServiceType = serviceType;
                    matchedKeyword = keyword;
                }
            }
        }
    }

    detectedService = matchedServiceType;

    // STEP 3: Handle platform-only queries
    if (detectedPlatform && !detectedService) {
        const defaults = PLATFORM_DEFAULTS[detectedPlatform];
        detectedService = defaults.primary;
        serviceConfidence = 0.7;
        detected.matchType = 'platform-only';
        
        console.log(`📌 Platform-only query for ${detectedPlatform}, using default: ${defaults.primary}`);
    }
    
    // STEP 4: Handle service-only queries
    else if (!detectedPlatform && detectedService) {
        const serviceConfig = SERVICE_KEYWORDS[detectedService];
        if (serviceConfig && serviceConfig.platforms.length > 0) {
            // If service is specific to one platform
            if (serviceConfig.platforms.length === 1) {
                detectedPlatform = serviceConfig.platforms[0];
                serviceConfidence = 0.8;
                detected.matchType = 'service-specific';
                console.log(`📌 Service-specific query: ${detectedService} → ${detectedPlatform}`);
            } else {
                detected.matchType = 'service-only-multi';
                console.log(`📌 Service-only query: ${detectedService} (multiple platforms)`);
            }
        }
    }
    
    // STEP 5: Handle combined platform+service queries
    else if (detectedPlatform && detectedService) {
        const serviceConfig = SERVICE_KEYWORDS[detectedService];
        if (serviceConfig && !serviceConfig.platforms.includes(detectedPlatform)) {
            console.log(`⚠️ Service ${detectedService} not available for ${detectedPlatform}`);
            
            // Smart conversion
            if (detectedService === 'followers' && detectedPlatform === 'youtube') {
                detectedService = 'subscribers';
                console.log(`🔄 Converted followers → subscribers for YouTube`);
            } else if (detectedService === 'subscribers' && detectedPlatform !== 'youtube') {
                detectedService = 'followers';
                console.log(`🔄 Converted subscribers → followers for ${detectedPlatform}`);
            } else {
                const defaults = PLATFORM_DEFAULTS[detectedPlatform];
                detectedService = defaults.primary;
                console.log(`🔄 Falling back to ${detectedPlatform} default: ${defaults.primary}`);
            }
        }
        detected.matchType = 'combined';
    }

    // Set final values
    detected.platform = detectedPlatform;
    detected.service = detectedService;
    detected.confidence = Math.max(platformConfidence, serviceConfidence);

    return detected;
}

/**
 * Filter services based on platform and service type - IMPROVED
 */
function filterServices(services, platform, serviceType) {
    if (!services || !services.length) return [];
    
    const platformLower = platform ? platform.toLowerCase() : '';
    const serviceLower = serviceType ? serviceType.toLowerCase() : '';
    
    // Service type to keyword mapping
    const serviceToKeywords = {
        'followers': ['follower', 'followers', 'fans'],
        'subscribers': ['subscriber', 'subscribers', 'subs'],
        'likes': ['like', 'likes', 'heart', 'hearts'],
        'views': ['view', 'views', 'plays'],
        'comments': ['comment', 'comments'],
        'shares': ['share', 'shares', 'repost'],
        'saves': ['save', 'saves', 'bookmark'],
        'story': ['story', 'stories'],
        'live': ['live', 'stream'],
        'channel': ['channel'],
        'reactions': ['reaction', 'reactions', 'emoji'],
        'watchtime': ['watch', 'hours', 'watchtime'],
        'group': ['group'],
        'poll': ['poll', 'vote']
    };
    
    // Get keywords for the service type
    const serviceKeywords = serviceToKeywords[serviceLower] || [serviceLower];
    
    // Platform variations
    const platformVariations = {
        'tiktok': ['tiktok', 'tt'],
        'instagram': ['instagram', 'ig', 'insta'],
        'facebook': ['facebook', 'fb'],
        'youtube': ['youtube', 'yt'],
        'whatsapp': ['whatsapp', 'wa']
    };
    
    const platformKeywords = platformVariations[platformLower] || [platformLower];
    
    return services.filter(service => {
        const nameLower = service.name.toLowerCase();
        const categoryLower = (service.category || '').toLowerCase();
        
        // Check platform match
        let platformMatch = true;
        if (platformLower) {
            platformMatch = platformKeywords.some(keyword => 
                nameLower.includes(keyword) || categoryLower.includes(keyword)
            );
        }
        
        // Check service type match
        let serviceMatch = true;
        if (serviceLower) {
            serviceMatch = serviceKeywords.some(keyword => 
                nameLower.includes(keyword) || categoryLower.includes(keyword)
            );
            
            // Special case for YouTube subscribers
            if (platformLower === 'youtube' && serviceLower === 'subscribers') {
                serviceMatch = serviceMatch || 
                    nameLower.includes('subscriber') || 
                    nameLower.includes('subs');
            }
            
            // Special case for TikTok/Instagram likes
            if (serviceLower === 'likes') {
                serviceMatch = serviceMatch || 
                    nameLower.includes('like') || 
                    nameLower.includes('heart');
            }
        }
        
        return platformMatch && serviceMatch;
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
 * Get top services (lowest 3, highest 2) - FIXED with error handling
 */
function getTopServices(services) {
    if (!services || services.length === 0) return [];
    
    try {
        // Create a copy and sort by price
        const sorted = [...services].sort((a, b) => {
            const priceA = extractNumericPrice(a);
            const priceB = extractNumericPrice(b);
            
            // Handle NaN values
            if (isNaN(priceA) && isNaN(priceB)) return 0;
            if (isNaN(priceA)) return 1;
            if (isNaN(priceB)) return -1;
            
            return priceA - priceB;
        });
        
        const lowest = sorted.slice(0, Math.min(3, sorted.length));
        const highest = sorted.length > 3 ? sorted.slice(-2) : [];
        
        const combined = [...lowest, ...highest];
        const unique = combined.filter((service, index, self) => 
            index === self.findIndex(s => s.service_id === service.service_id)
        );
        
        return unique;
    } catch (error) {
        console.error("❌ Error in getTopServices:", error);
        return services.slice(0, 5); // Fallback to first 5 services
    }
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
            
            // If still no results, show platform services as fallback
            if (filtered.length === 0 && detected.platform) {
                console.log(`ℹ️ No specific matches for ${detected.platform} ${detected.service}, showing all ${detected.platform} services`);
                filtered = filterServices(services, detected.platform, null);
            }
            
            // Final fallback - show some services
            if (filtered.length === 0) {
                console.log('ℹ️ No matches found, showing popular services');
                filtered = services.slice(0, 10);
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

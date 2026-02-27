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

// Platform keywords with variations
const PLATFORM_KEYWORDS = {
    tiktok: ['tiktok', 'tt', 'tik'],
    instagram: ['instagram', 'ig', 'insta'],
    facebook: ['facebook', 'fb'],
    youtube: ['youtube', 'yt', 'tube'],
    whatsapp: ['whatsapp', 'wa']
};

// Service triggers for detecting user intent
const serviceTriggers = [
    // Core service keywords
    'price', 'cost', 'rate', 'service', 'buy', 'purchase', 'order',
    
    // Platform names
    'instagram', 'ig', 'insta',
    'facebook', 'fb',
    'tiktok', 'tt', 'tik',
    'youtube', 'yt', 'tube',
    'whatsapp', 'wa',
    
    // Service types
    'follower', 'followers', 'fans',
    'like', 'likes', 'heart', 'reaction', 'reactions',
    'view', 'views', 'plays', 'watch',
    'comment', 'comments', 'reply',
    'share', 'shares', 'repost',
    'save', 'saves', 'bookmark',
    'story', 'stories',
    'live', 'stream',
    'subscriber', 'subscribers', 'subs',
    'member', 'members', 'channel',
    'watchtime', 'watch time', 'watch hours', 'hours',
    'group', 'groups',
    'poll', 'votes',
    'video', 'videos',
    'post', 'posts',
    'page', 'pages',
    'reel', 'reels',
    'impression', 'impressions',
    'reach',
    'emoji'
];

// Service keywords for matching
const SERVICE_KEYWORDS = {
    // Core Services
    followers: ['follower', 'followers', 'fans'],
    likes: ['like', 'likes', 'heart'],
    views: ['view', 'views', 'plays'],
    comments: ['comment', 'comments', 'reply'],
    shares: ['share', 'shares', 'repost', 'reposts'],
    saves: ['save', 'saves', 'bookmark'],
    
    // Content Types
    video: ['video', 'videos'],
    post: ['post', 'posts'],
    page: ['page', 'pages'],
    story: ['story', 'stories'],
    reel: ['reel', 'reels'],
    live: ['live', 'stream'],
    
    // Platform Specific
    subscribers: ['subscriber', 'subscribers', 'subs'],
    channel: ['channel', 'members'],
    reactions: ['reaction', 'reactions', 'emoji'],
    watchtime: ['watch time', 'watch hours', 'hours', 'watchtime'],
    group: ['group', 'groups', 'group members'],
    poll: ['poll', 'votes', 'voting'],
    
    // Advanced Services
    impressions: ['impression', 'impressions'],
    reach: ['reach'],
    discover: ['discover', 'discovery'],
    repost: ['repost', 'reposts'],
    
    // Package Types
    package: ['package', 'growth package', 'premium'],
    custom: ['custom', 'custom comments'],
    
    // Quality Indicators
    real: ['real', 'real accounts'],
    hq: ['hq', 'high quality'],
    lq: ['lq', 'low quality'],
    active: ['active', 'active accounts'],
    
    // Special Features
    autorefill: ['auto refill', 'refill', '♻️'],
    norefill: ['no refill', 'nr', '⚠️'],
    instant: ['instant', 'instant start'],
    fast: ['fast', '🚀', 'ultrafast', '⚡'],
    cancel: ['cancel', 'cancel enable'],
    drop: ['drop', 'non drop', 'low drop'],
    retention: ['retention', 'retention seconds'],
    
    // YouTube Specific
    watchhours: ['watch hours', 'watch time views'],
    adwords: ['adwords', 'google ads'],
    ctrviews: ['ctr', 'ctr views', 'search views'],
    socialshares: ['social shares'],
    
    // Instagram Specific
    storyviews: ['story views'],
    storyreactions: ['story reactions'],
    storycomments: ['story comments'],
    storypoll: ['story poll', 'poll votes'],
    channelmember: ['channel member'],
    profilevisit: ['profile visit', 'profil visit'],
    
    // Facebook Specific
    pagelikes: ['page likes'],
    postlikes: ['post likes'],
    postreactions: ['post reactions'],
    groupmembers: ['group members'],
    storyreactions: ['story reactions'],
    watchtimeviews: ['watch time views'],
    
    // TikTok Specific
    videoviews: ['video views'],
    videosave: ['video save'],
    videoshare: ['video share'],
    livestreamviews: ['live stream views'],
    randomcomments: ['random comments'],
    emojicomments: ['emoji comments'],
    customcomments: ['custom comments'],
    
    // WhatsApp Specific
    channelmembers: ['channel members'],
    emojireactions: ['emoji reactions', 'post emoji reactions']
};

// Category mapping for better service grouping
const CATEGORY_PATTERNS = {
    // TikTok Categories
    tiktok_followers_recommended: ['tiktok followers [ recommended', 'tiktok followers [ updated', 'tiktok followers [ ♻️', 'tiktok followers [ non drop'],
    tiktok_likes: ['tiktok likes [ accounts with profile photos', 'tiktok likes [ hq accounts', 'tiktok likes [ drop 0%', 'tiktok likes [ super fast'],
    tiktok_views: ['tiktok video views [ best price', 'tiktok video views [ lowest price', 'tiktok video views [ drop 0%'],
    tiktok_comments: ['tiktok comments [ cheapest working', 'tiktok comments [ custom'],
    tiktok_saves: ['tiktok video save'],
    tiktok_shares: ['tiktok video share', 'tiktok reposts'],
    tiktok_live: ['tiktok live stream views'],
    
    // Instagram Categories
    instagram_followers: ['instagram followers [ 100% real', 'instagram followers [ cheapest price', 'instagram followers [ 100% old'],
    instagram_likes: ['instagram likes [ accounts with profile photos', 'instagram likes [ 100% real', 'instagram likes [ old accounts', 'instagram likes [ drop 0%', 'instagram likes [ cheap'],
    instagram_views: ['instagram video views', 'instagram story views'],
    instagram_comments: ['instagram comments [ cheapest', 'instagram comments [ recommended', 'instagram comments [ custom'],
    instagram_story: ['instagram story views', 'instagram story comments', 'instagram story poll'],
    instagram_saves: ['instagram save', 'instagram post save'],
    instagram_channel: ['instagram channel member'],
    instagram_reach: ['instagram impression services', 'instagram reach'],
    
    // Facebook Categories
    facebook_followers: ['facebook followers [ best price', 'facebook followers [ hidden accounts', 'facebook followers [ cheapest'],
    facebook_likes: ['facebook post likes', 'facebook page likes', 'facebook post reactions'],
    facebook_views: ['facebook views [ video / reels', 'facebook live stream views', 'facebook story views'],
    facebook_comments: ['facebook comments [ best price', 'facebook comments [ custom'],
    facebook_group: ['facebook group members'],
    facebook_story: ['facebook story reactions', 'facebook story views'],
    
    // YouTube Categories
    youtube_views: ['youtube views [ best', 'youtube views [ recommended', 'youtube views [ 100% real', 'youtube adwords views'],
    youtube_subscribers: ['youtube subscribers [ fastest', 'youtube subscribers [ update working', 'youtube subscribers ♻️'],
    youtube_likes: ['youtube likes ♻️'],
    youtube_comments: ['youtube custom comments reply', 'youtube video/shorts comments', 'youtube live stream custom chat'],
    youtube_watchtime: ['youtube watch time views', 'youtube watch hours'],
    youtube_live: ['youtube live stream views', 'youtube live stream reaction'],
    youtube_shares: ['youtube social shares', 'youtube shares'],
    
    // WhatsApp Categories
    whatsapp_members: ['whatsapp channel members', 'whatsapp channel member'],
    whatsapp_reactions: ['whatsapp channel emoji reactions', 'whatsapp channel post emoji reactions']
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
 * Detect service type from query with improved matching
 */
function detectService(query) {
    const normalized = normalize(query);
    
    // Check for multi-word services first (longer phrases)
    const multiWordServices = [
        'video views', 'story views', 'story reactions', 'post likes', 
        'page likes', 'channel members', 'channel reactions', 'live stream',
        'watch time', 'group members', 'poll votes', 'custom comments',
        'random comments', 'emoji reactions', 'growth package', 'auto refill'
    ];
    
    for (const service of multiWordServices) {
        if (normalized.includes(service)) {
            // Convert to camelCase or remove spaces for key matching
            return service.replace(/\s+/g, '');
        }
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
 * Check if service is primary (appears in first few words)
 */
function isPrimaryService(service, platform, serviceType) {
    const name = normalize(service.name || "");
    const platformKeywords = PLATFORM_KEYWORDS[platform] || [platform];
    const serviceKeywords = SERVICE_KEYWORDS[serviceType] || [serviceType];
    
    // Get first 8 words of service name
    const words = name.split(' ').slice(0, 8);
    const nameStart = words.join(' ');
    
    // Check if platform appears in first 3 words
    const hasPlatformEarly = platformKeywords.some(kw => 
        words.slice(0, 3).some(word => word.includes(kw) || kw.includes(word))
    );
    
    if (!hasPlatformEarly) return false;
    
    // Check if service type appears in first 6 words
    const hasServiceEarly = serviceKeywords.some(kw => 
        words.slice(0, 6).some(word => word.includes(kw) || kw.includes(word))
    );
    
    return hasServiceEarly;
}

/**
 * Enhanced category-based filtering using category patterns
 */
function filterByCategory(services, platform, service) {
    if (!services || !services.length) return [];
    
    const platformLower = platform ? platform.toLowerCase() : null;
    const serviceLower = service ? service.toLowerCase() : null;
    
    // Get platform keywords
    const platformKeywords = platformLower ? PLATFORM_KEYWORDS[platformLower] || [platformLower] : null;
    
    // Get service keywords
    let serviceKeywords = [];
    if (serviceLower && SERVICE_KEYWORDS[serviceLower]) {
        serviceKeywords = SERVICE_KEYWORDS[serviceLower];
    } else if (serviceLower) {
        serviceKeywords = [serviceLower];
    }
    
    // Find matching category patterns
    let matchingCategoryPatterns = [];
    if (platformLower && serviceLower) {
        const categoryKey = `${platformLower}_${serviceLower}`;
        for (const [patternKey, patterns] of Object.entries(CATEGORY_PATTERNS)) {
            if (patternKey.includes(platformLower) && patternKey.includes(serviceLower)) {
                matchingCategoryPatterns.push(...patterns);
            }
        }
    }
    
    // Filter services
    let filtered = services.filter(svc => {
        const category = normalize(svc.category || "");
        const name = normalize(svc.name || "");
        
        // Platform must match in category or name
        if (platformKeywords) {
            const hasPlatformInCategory = platformKeywords.some(kw => category.includes(kw));
            const hasPlatformInName = platformKeywords.some(kw => name.includes(kw));
            if (!hasPlatformInCategory && !hasPlatformInName) return false;
        }
        
        // Service must match
        if (serviceKeywords.length > 0) {
            const hasServiceInCategory = serviceKeywords.some(kw => category.includes(kw));
            const hasServiceInName = serviceKeywords.some(kw => name.includes(kw));
            
            // Special handling for combined services
            if (serviceLower === 'pagelikes' || serviceLower === 'postlikes') {
                return (hasServiceInCategory || hasServiceInName) && 
                       (name.includes('page') || name.includes('post'));
            }
            
            if (!hasServiceInCategory && !hasServiceInName) return false;
        }
        
        // Check category patterns if available
        if (matchingCategoryPatterns.length > 0) {
            return matchingCategoryPatterns.some(pattern => category.includes(pattern));
        }
        
        return true;
    });
    
    // Apply primary service check for more accurate results
    if (platformLower && serviceLower && filtered.length > 3) {
        filtered = filtered.filter(svc => 
            isPrimaryService(svc, platformLower, serviceLower)
        );
    }
    
    return filtered;
}

/**
 * Get 3 cheapest + 2 most expensive from primary services
 */
function getPriceExtremes(services, platform, service) {
    if (!services.length) return [];
    
    // Further filter to primary services for expensive ones
    let primaryServices = services;
    if (platform && service) {
        primaryServices = services.filter(svc => 
            isPrimaryService(svc, platform, service)
        );
    }
    
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
 * Fallback filtering by name
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
    
    let filtered = services.filter(svc => {
        const name = normalize(svc.name || "");
        
        if (platformKeywords) {
            const hasPlatformInName = platformKeywords.some(kw => name.includes(kw));
            if (!hasPlatformInName) return false;
        }
        
        if (serviceKeywords.length > 0) {
            const hasServiceInName = serviceKeywords.some(kw => name.includes(kw));
            if (!hasServiceInName) return false;
        }
        
        return true;
    });
    
    // Apply primary service check
    if (platformLower && serviceLower && filtered.length > 3) {
        filtered = filtered.filter(svc => 
            isPrimaryService(svc, platformLower, serviceLower)
        );
    }
    
    return filtered;
}

function createServiceItem(service, index) {
    const emoji = numberToEmoji(index + 1);
    const priceDisplay = formatPriceDisplay(service);
    
    // Extract service type from name for better display
    const nameParts = service.name.split('[');
    const serviceType = nameParts[0].trim();
    
    return `${emoji} *${serviceType}*\n` +
           `${priceDisplay}\n` +
           `📦 Min: ${service.min} | Max: ${service.max}\n` +
           `🔗 https://makemetrend.online/services\n` +
           `────────────────────`;
}

function formatServiceType(service) {
    if (!service) return 'SERVICES';
    
    const serviceMap = {
        followers: 'FOLLOWERS',
        likes: 'LIKES',
        views: 'VIEWS',
        comments: 'COMMENTS',
        shares: 'SHARES',
        saves: 'SAVES',
        story: 'STORY',
        live: 'LIVE',
        subscribers: 'SUBSCRIBERS',
        channel: 'CHANNEL',
        reactions: 'REACTIONS',
        watchtime: 'WATCH TIME',
        group: 'GROUP',
        poll: 'POLL',
        video: 'VIDEO',
        post: 'POST',
        page: 'PAGE',
        reel: 'REEL',
        videoviews: 'VIDEO VIEWS',
        storyviews: 'STORY VIEWS',
        pagelikes: 'PAGE LIKES',
        postlikes: 'POST LIKES',
        channelmembers: 'CHANNEL MEMBERS',
        customcomments: 'CUSTOM COMMENTS'
    };
    
    return serviceMap[service] || service.toUpperCase();
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

            // Check if it's a service query using serviceTriggers
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

            console.log('\n📊 [ENHANCED SERVICE DETECTION] ==================');
            console.log('📝 Query    :', text);
            console.log('📱 Platform :', platform || '❌ Not detected');
            console.log('🎯 Service  :', service || '❌ Not detected');
            console.log('================================================\n');

            if (!platform || !service) {
                // Show available options if incomplete query
                let helpText = "╭━━━〔 🎯 *SMM SERVICES* 〕━━━━╮\n\n";
                helpText += "❌ *Please specify both platform and service*\n\n";
                helpText += "📝 *Available Platforms:*\n";
                helpText += "• Instagram (ig, insta)\n";
                helpText += "• TikTok (tt, tik)\n";
                helpText += "• Facebook (fb)\n";
                helpText += "• YouTube (yt, tube)\n";
                helpText += "• WhatsApp (wa)\n\n";
                helpText += "📝 *Common Services:*\n";
                helpText += "• followers, likes, views\n";
                helpText += "• comments, shares, saves\n";
                helpText += "• story, live, reel\n";
                helpText += "• channel, reactions, watchtime\n\n";
                helpText += "📝 *Examples:*\n";
                helpText += "• instagram likes\n";
                helpText += "• tiktok followers\n";
                helpText += "• facebook page likes\n";
                helpText += "• youtube subscribers\n";
                helpText += "• whatsapp channel\n\n";
                helpText += "📞 *Support:* wa.me/94722136082\n";
                helpText += "🌐 *Website:* https://makemetrend.online\n";
                helpText += "╰━━━━━━━━━━━━━━━━━━━━━━━━╯";
                
                await conn.sendMessage(from, { text: helpText }, { quoted: mek });
                return;
            }

            // Filter by category (primary method)
            let filtered = filterByCategory(services, platform, service);
            
            console.log(`🔍 Category filter: found ${filtered.length} ${service} services for ${platform}`);

            // Fallback to name filtering if needed
            if (filtered.length === 0) {
                console.log(`ℹ️ No category matches, trying name filter`);
                filtered = filterByName(services, platform, service);
                console.log(`🔍 Name filter: found ${filtered.length} ${service} services`);
            }

            // Final fallback - platform only
            if (filtered.length === 0) {
                console.log(`ℹ️ No ${service} services found, showing all ${platform} services`);
                filtered = filterByCategory(services, platform, null);
                if (filtered.length === 0) {
                    filtered = filterByName(services, platform, null);
                }
            }

            // Get 3 cheapest + 2 most expensive
            const selectedServices = getPriceExtremes(filtered, platform, service);

            if (selectedServices.length === 0) {
                await conn.sendMessage(from, { 
                    text: `❌ No ${platform} ${service} services found. Please try a different combination.` 
                }, { quoted: mek });
                return;
            }

            // Build response with enhanced formatting
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
                post: '📝', page: '📄', reel: '🎥',
                videoviews: '🎬', storyviews: '📖', pagelikes: '👍',
                postlikes: '👍', channelmembers: '👥', customcomments: '💭'
            }[service] || '🎯';
            
            messageText += `${platformEmoji} *Platform:* ${platform.toUpperCase()}\n`;
            messageText += `${serviceEmoji} *Service:* ${formatServiceType(service)}\n`;
            
            // Show category if available
            if (filtered.length > 0 && filtered[0].category) {
                const categoryName = filtered[0].category.split('[')[0].trim();
                messageText += `📁 *Category:* ${categoryName}\n`;
            }
            
            messageText += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            selectedServices.forEach((svc, idx) => {
                messageText += createServiceItem(svc, idx) + "\n\n";
            });

            // Add helpful tips
            messageText += `💡 *Tip:* ${selectedServices.length} best ${platform} ${service} services shown\n`;
            messageText += `   (3 cheapest + 2 most expensive)\n\n`;
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

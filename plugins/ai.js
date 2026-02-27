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
    'price', 'cost', 'rate', 'service', 'buy', 'purchase', 'order',
    'instagram', 'ig', 'insta', 'facebook', 'fb', 'tiktok', 'tt', 'tik',
    'youtube', 'yt', 'tube', 'whatsapp', 'wa',
    'follower', 'followers', 'fans', 'like', 'likes', 'heart', 'reaction', 'reactions',
    'view', 'views', 'plays', 'watch', 'comment', 'comments', 'reply',
    'share', 'shares', 'repost', 'save', 'saves', 'bookmark',
    'story', 'stories', 'live', 'stream', 'subscriber', 'subscribers', 'subs',
    'member', 'members', 'channel', 'watchtime', 'watch time', 'watch hours', 'hours',
    'group', 'groups', 'poll', 'votes', 'video', 'videos', 'post', 'posts',
    'page', 'pages', 'reel', 'reels', 'impression', 'impressions', 'reach', 'emoji'
];

// Service keywords for matching
const SERVICE_KEYWORDS = {
    followers: ['follower', 'followers', 'fans'],
    likes: ['like', 'likes', 'heart'],
    views: ['view', 'views', 'plays'],
    comments: ['comment', 'comments', 'reply'],
    shares: ['share', 'shares', 'repost', 'reposts'],
    saves: ['save', 'saves', 'bookmark'],
    video: ['video', 'videos'],
    post: ['post', 'posts'],
    page: ['page', 'pages'],
    story: ['story', 'stories'],
    reel: ['reel', 'reels'],
    live: ['live', 'stream'],
    subscribers: ['subscriber', 'subscribers', 'subs'],
    channel: ['channel', 'members'],
    reactions: ['reaction', 'reactions', 'emoji'],
    watchtime: ['watch time', 'watch hours', 'hours', 'watchtime'],
    group: ['group', 'groups', 'group members'],
    poll: ['poll', 'votes', 'voting'],
    impressions: ['impression', 'impressions'],
    reach: ['reach'],
    discover: ['discover', 'discovery'],
    repost: ['repost', 'reposts'],
    package: ['package', 'growth package', 'premium'],
    custom: ['custom', 'custom comments'],
    real: ['real', 'real accounts'],
    hq: ['hq', 'high quality'],
    lq: ['lq', 'low quality'],
    active: ['active', 'active accounts'],
    autorefill: ['auto refill', 'refill', '♻️'],
    norefill: ['no refill', 'nr', '⚠️'],
    instant: ['instant', 'instant start'],
    fast: ['fast', '🚀', 'ultrafast', '⚡'],
    cancel: ['cancel', 'cancel enable'],
    drop: ['drop', 'non drop', 'low drop'],
    retention: ['retention', 'retention seconds'],
    watchhours: ['watch hours', 'watch time views'],
    adwords: ['adwords', 'google ads'],
    ctrviews: ['ctr', 'ctr views', 'search views'],
    socialshares: ['social shares'],
    storyviews: ['story views'],
    storyreactions: ['story reactions'],
    storycomments: ['story comments'],
    storypoll: ['story poll', 'poll votes'],
    channelmember: ['channel member'],
    profilevisit: ['profile visit', 'profil visit'],
    pagelikes: ['page likes'],
    postlikes: ['post likes'],
    postreactions: ['post reactions'],
    groupmembers: ['group members'],
    watchtimeviews: ['watch time views'],
    videoviews: ['video views'],
    videosave: ['video save'],
    videoshare: ['video share'],
    livestreamviews: ['live stream views'],
    randomcomments: ['random comments'],
    emojicomments: ['emoji comments'],
    customcomments: ['custom comments'],
    channelmembers: ['channel members'],
    emojireactions: ['emoji reactions', 'post emoji reactions']
};

// Complete category lists from your services.json
const TIKTOK_CATEGORIES = [
    'Tiktok Followers [ Recommended ⭐ ] ᴺᴱᵂ',
    'TikTok Likes [ Accounts with Profile Photos ] ᴺᴱᵂ',
    'TikTok Likes [ HQ Accounts ] [ Auto Refill ♻️ ] ᴺᴱᵂ',
    'TikTok Video Views [ Best Price 💫 ] ᴺᴱᵂ',
    'TikTok Reposts ᴺᴱᵂ',
    'TikTok Followers [ Updated 01.02.2026 ] ᴺᴱᵂ',
    'TikTok Likes [ Drop 0% ] ᴺᴱᵂ',
    'TikTok Followers [ 100% Real Accounts ] [ Emergency 🚨 ] ᴺᴱᵂ',
    'TikTok Video Views [ Lowest Price 💥 ] ᴺᴱᵂ',
    'TikTok Followers [ ♻️ Auto Refill / Best Working ⭐ ] ᴺᴱᵂ',
    'TikTok Video Save [ Cheapest 💥] ᴺᴱᵂ',
    'Tiktok Followers [ 100% Real Accounts With Posts ] ᴺᴱᵂ',
    'Tiktok Video Views [ Cheapest 💥] [ Fast 🚀 ] ᴺᴱᵂ',
    'Tiktok Followers [ Non Drop 🎖️ ] ᴺᴱᵂ',
    'TikTok Likes [ Super Fast 🚀 ] [ Cheapest 💥] ᴺᴱᵂ',
    'Tiktok Video Views [ Auto Refill ♻️ ] ᴺᴱᵂ',
    'TikTok Video Save ᴺᴱᵂ',
    'Tiktok Video Share ᴺᴱᵂ',
    'TikTok Comments [ Cheapest Working 💫 ] ᴺᴱᵂ',
    'TikTok Video Views [ Drop 0% ] ᴺᴱᵂ',
    'TikTok Video Views [ Drop 0% ] [ ⚙️ Auto Refill ♻️ ] ᴺᴱᵂ',
    'Tiktok Likes',
    'Tiktok Likes ♻️',
    'TikTok Comments [ Custom ]',
    'TikTok Live Stream Views + [ Like + Share ]',
    'TikTok Video Views [ Cheapest 💥 ] ᴺᴱᵂ',
    'Tiktok Video Views',
    'TikTok Video Share',
    'TikTok Followers [ Targeted ]',
    'TikTok Followers [ Targeted ] [ HQ ]',
    'TikTok Followers [ Targeted ] [ 365 Days ♻️ ]',
    'Tiktok Followers [ Saudi Arabia 🇸🇦 ]'
];

const INSTAGRAM_CATEGORIES = [
    'Instagram Followers [ 100% Real Accounts ] ᴺᴱᵂ',
    'Instagram Followers [ Cheapest Price 💫 ] ᴺᴱᵂ',
    'Instagram Followers [ 100% Real Accounts With Posts ] ᴺᴱᵂ',
    'Instagram Likes [ Accounts with Profile Photos ] ᴺᴱᵂ',
    'Instagram Likes [ 100% Real Accounts ] [ Best Price 💫 ] ᴺᴱᵂ',
    'Instagram Story Views [ Targeted ] ᴺᴱᵂ',
    'Instagram Comments [ Cheapest 💥] ᴺᴱᵂ',
    'Instagram Likes [ 100% Active and Real Accounts ] ᴺᴱᵂ',
    'Instagram Comments [ Recommended ⭐ ] ᴺᴱᵂ',
    'Instagram Followers [ 100% Old Accounts ] [ Cheapest 💥] ᴺᴱᵂ',
    'Instagram Video Views [ Cheapest 💥] ᴺᴱᵂ',
    'Instagram Post Discovery Packages [ Provider ] ᴺᴱᵂ',
    'Instagram Likes [ Old Accounts ] [ Stable ✨ ] ᴺᴱᵂ',
    'Instagram Services [ Best Price 💫 ] ᴺᴱᵂ',
    'Instagram Comments [ Best Price 💫 ] ᴺᴱᵂ',
    'Instagram Likes [ Cheapest 💫 ] ᴺᴱᵂ',
    'Instagram Likes [ Drop 0% ] ᴺᴱᵂ',
    'Instagram Likes [ India 🇮🇳 ] [ Drop 0% ] ᴺᴱᵂ',
    'Instagram Likes [ Slow Working ] ᴺᴱᵂ',
    '🚀 Instagram Premium Growth Plans [ 7 Days ] Provider',
    '🚀 Instagram Premium Growth Plans [ 30 Days ] Provider',
    'Instagram Real Followers [ Old Accounts ] [ No Refill ⚠️ ]',
    'Instagram Real Followers [ Old Accounts ] [ Lifetime ♻️ ]',
    'Instagram Followers [ Likes + Story Views + Profile Views ] [ Old Accounts ]',
    'Instagram Likes [ Auto ⚙️]',
    'Instagram Video Views',
    'Instagram Comments [ Custom ]',
    'Instagram Repost',
    'Instagram Story Comments [Random] [Verified Accounts]',
    'Instagram Impression Services',
    'Instagram Story Poll Votes',
    'Instagram Save',
    'Instagram Channel Member [ Targeted ] [ Cheapest ]'
];

const FACEBOOK_CATEGORIES = [
    'Facebook Followers [ Best Price 💫 ] ᴺᴱᵂ',
    'Facebook Post Likes [ Best Price 💫 ] ᴺᴱᵂ',
    'Facebook Post Reactions [ Best Price 💫 ] ᴺᴱᵂ',
    'Facebook Followers [ Hidden Accounts ] [ Cheapest 💥 ] ᴺᴱᵂ',
    'Facebook Followers [ Cheapest 💥] ᴺᴱᵂ',
    'Facebook Page Likes + Followers [ Cheapest 💥 ] ᴺᴱᵂ',
    'Facebook Group Members [ Cheapest 💥] ᴺᴱᵂ',
    'Facebook Post Likes [ Cheapest 💥 ] ᴺᴱᵂ',
    'Facebook Live Stream Views [ 100% Concurrent ] [ Cheapest 💥 ] ᴺᴱᵂ',
    'Facebook Comments [ Best Price 💫 ] ᴺᴱᵂ',
    'Facebook Views [ Video / Reels ] ᴺᴱᵂ',
    'Facebook Story Reactions [ Cheapest 💫 ] ᴺᴱᵂ',
    'Facebook Watch Time Views [ 60K Minutes ] [ Lifetime ♻️ ] ᴺᴱᵂ',
    'Facebook Post Reactions [ Cheapest 💫 ] ᴺᴱᵂ',
    'Facebook Page Likes + Followers [ Cheapest 💫 ] ᴺᴱᵂ',
    'Facebook Page Likes',
    'Facebook Story Views',
    'Facebook Story Reactions',
    'Facebook Comments',
    'Facebook | Post Reactions - Guaranteed ♻️ | High Speed'
];

const YOUTUBE_CATEGORIES = [
    'Youtube Views [ Best ⭐ ] ᴺᴱᵂ',
    'Youtube Views [ Recommended ⭐ ] ᴺᴱᵂ',
    'YouTube Custom Comments Reply ᴺᴱᵂ',
    'YouTube Comment Reply Likes ᴺᴱᵂ',
    'YouTube Video/Shorts Comments Created by AI 🤖 ᴺᴱᵂ',
    'YouTube Video/Shorts Comment Likes ᴺᴱᵂ',
    'YouTube Live Stream Custom Chat Comments ᴺᴱᵂ',
    'Youtube Subscribers [ Fastest Service 🚀 ] ᴺᴱᵂ',
    'YouTube Watch Time Views ᴺᴱᵂ',
    'YouTube Services [ 100% Real ] ᴺᴱᵂ',
    'Youtube Subscribers [ Update Working ] ᴺᴱᵂ',
    'YouTube Hype Boost [ Provider ] ᴺᴱᵂ',
    'Youtube Views [ Recommended 🎖️] ᴺᴱᵂ',
    'Youtube Watch Time Views ᴺᴱᵂ',
    'YouTube Live Stream Views + Likes [ 100% Concurrent ] ᴺᴱᵂ',
    'Youtube Adwords Views [ 100% Real Views ] ᴺᴱᵂ',
    'Youtube Views [ 100% Real Quality Views ] ♻️ ᴺᴱᵂ',
    'YouTube Views [ CTR Search ] ᴺᴱᵂ',
    'YouTube Shares [ Choose Speed ] ᴺᴱᵂ',
    'YouTube Shares [ Choose GEO ] ᴺᴱᵂ',
    'YouTube Shares [ Choose Referrer ] ᴺᴱᵂ',
    'YouTube WatchTime [ 100% Google Ads ]',
    'YouTube Watch Hours [ 100% Stabil ]',
    'YouTube Watch Hours',
    'YouTube Views [ Native Ads ]',
    'Youtube Views ♻️',
    'Youtube Subscribers ⚠️',
    'Youtube Subscribers ♻️',
    'Youtube Subscribers | Targeted ♻️',
    'Youtube Likes ♻️',
    'Youtube Comments [ Custom ]',
    'Youtube Comments Likes',
    'YouTube Live Stream Views',
    'YouTube Live Stream Reaction',
    'Youtube | %100 Organic Services'
];

const WHATSAPP_CATEGORIES = [
    'Whatsapp Channel Member [ Cheapest 💥] ᴺᴱᵂ',
    'Whatsapp Channel Members [ Cheapest ]',
    'Whatsapp Channel Members [ Targeted ]',
    'Whatsapp Channel Emoji Reactions [ Cheap Slow Server ]'
];

// Combined category map for easy lookup
const CATEGORY_MAP = {
    tiktok: TIKTOK_CATEGORIES,
    instagram: INSTAGRAM_CATEGORIES,
    facebook: FACEBOOK_CATEGORIES,
    youtube: YOUTUBE_CATEGORIES,
    whatsapp: WHATSAPP_CATEGORIES
};

// Default services for platform-only queries (5 popular services per platform)
const DEFAULT_SERVICES = {
    tiktok: [
        'TikTok Followers [ Max 100K ] | 100% Real Accounts | No Refill ⚠️ | Instant Start | Day 30K',
        'TikTok Likes [ Max 10M ] | Accounts with Profile Photos | Cancel Enable | Low Drop | No Refill ⚠️ | Instant Start | Day 100K 🚀',
        'TikTok Video Views [ Max Unlimited ] | HQ | Cancel Enable | No Refill ⚠️ | Instant Start | Day 10M 🚀',
        'TikTok Reposts [ Max 500K ] | HQ Accounts | Cancel Enable | No Refill ⚠️ | Instant Start | Day 100K 🚀',
        'TikTok Live Stream Views + %200 Like + Share [ Max 20K ] | 15 Minutes'
    ],
    instagram: [
        'Instagram Followers [ Max 100K ] | 100% Real Accounts | No Refill ⚠️ | Instant Start | Day 100K 🚀',
        'Instagram Likes [ Max 10M ] | Accounts with Profile Photos | Cancel Enable | Non Drop | No Refill ⚠️ | Instant Start | Day 200K 🚀',
        'Instagram Story Views [ Worldwide 🌍 ] [ Max 100K ] | 100% Real Accounts | Cancel Enable | Non Drop | Instant Start | Day 100K 🚀',
        'Instagram Video Views [ Max Unlimited ] | All Type Link | Instant Start | Day 500K 🚀',
        'Instagram Channel Member | Global 🌎 | [ Max 100K ] | HQ Real | Instant 𝟏 𝐌𝐢𝐧𝐮𝐭𝐞𝐬 𝐂𝐨𝐦𝐩𝐥𝐞𝐭𝐞𝐝 🚀'
    ],
    facebook: [
        'Facebook Followers [ All Type ] [ Max 100K ] | LQ Accounts | Cancel Enable | No Refill ⚠️ | Instant Start | Day 100K 🚀',
        'Facebook Post Likes [ Max 1M ] | HQ Accounts | Cancel Enable | Low Drop | No Refill ⚠️ | Instant Start | Day 100K 🚀',
        'Facebook Page Likes + Followers [ Max 1M ] | HQ Accounts | Low Drop | No Refill ⚠️ | Instant Start | Day 100K 🚀',
        'Facebook Live Stream Views [ Max 30K ] | Instant Start | 15 Minutes',
        'Facebook Story Reactions [ 👍 ] [ Max 500K ] | HQ Accounts | No Refill ⚠️ | Instant Start | Day 100K 🚀'
    ],
    youtube: [
        'YouTube Views [ Max 10M ] | Source: Mix / Suggested | Non Drop | Lifetime ♻️ | Instant Start | Day 150K 🚀',
        'YouTube Subscribers [ Max 50K ] | 100% Real Accounts | Drop 0% | 30 Days ♻️ | Instant Start | Day 10K 🚀',
        'YouTube Likes [ Max 50K ] | 100% Real Accounts | Drop 0-5% | Lifetime ♻️ | Instant Start | Day 100K 🚀',
        'YouTube Custom Comments Reply [ Max 10K ] | Video / Shorts / Live Stream | 100% Real Accounts | Non Drop | 30 Days ♻️ | Instant Start | Day 10K 🚀',
        'YouTube Live Stream Views [ Max 5M ] | %100 Real | %100 Concurrent | 15 Minutes'
    ],
    whatsapp: [
        'Whatsapp Channel Members [ Max 5K ] | HQ Accounts | Drop 0% | Instant Start | Day 5K 🚀',
        '🌎 Whatsapp Channel Members [ Global ] | [ Max 10K ] | HQ Profiles | Day 2K',
        'Whatsapp Channel Post Emoji Reactions [ 👍 ] [ Max 50K ] | Instant Start',
        'Whatsapp Channel Emoji Reactions [ ❤️ ] [ Max 100K ] | Instant Start 🚀',
        'Whatsapp Channel Members [ Global 🌎 ] [ Max 50K ] | HQ Profiles | Complete In 1 Minute 🚀'
    ]
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
        'video views', 'story views', 'story reactions', 'post likes', 
        'page likes', 'channel members', 'channel reactions', 'live stream',
        'watch time', 'group members', 'poll votes', 'custom comments',
        'random comments', 'emoji reactions', 'growth package', 'auto refill'
    ];
    
    for (const service of multiWordServices) {
        if (normalized.includes(service)) {
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
 * Filter services by category
 */
function filterByCategory(services, platform, service) {
    if (!services || !services.length) return [];
    
    const platformLower = platform ? platform.toLowerCase() : null;
    const serviceLower = service ? service.toLowerCase() : null;
    
    // Get platform categories
    const platformCategories = platformLower ? CATEGORY_MAP[platformLower] || [] : [];
    
    // Get platform keywords
    const platformKeywords = platformLower ? PLATFORM_KEYWORDS[platformLower] || [platformLower] : null;
    
    // Get service keywords
    let serviceKeywords = [];
    if (serviceLower && SERVICE_KEYWORDS[serviceLower]) {
        serviceKeywords = SERVICE_KEYWORDS[serviceLower];
    } else if (serviceLower) {
        serviceKeywords = [serviceLower];
    }
    
    return services.filter(svc => {
        const category = svc.category || "";
        const name = svc.name || "";
        const normalizedName = normalize(name);
        const normalizedCategory = normalize(category);
        
        // Platform must match in category
        if (platformKeywords) {
            const hasPlatformInCategory = platformKeywords.some(kw => 
                normalizedCategory.includes(kw)
            );
            if (!hasPlatformInCategory) return false;
        }
        
        // If service specified, check if it matches
        if (serviceKeywords.length > 0) {
            const hasServiceInCategory = serviceKeywords.some(kw => 
                normalizedCategory.includes(kw)
            );
            const hasServiceInName = serviceKeywords.some(kw => 
                normalizedName.includes(kw)
            );
            
            // For better accuracy, prefer category matches
            if (platformCategories.length > 0) {
                // Check if category is in platform's category list
                const isInPlatformCategory = platformCategories.some(cat => 
                    normalize(cat).includes(serviceKeywords[0])
                );
                
                if (isInPlatformCategory) return true;
            }
            
            return hasServiceInCategory || hasServiceInName;
        }
        
        return true;
    });
}

/**
 * Get 3 cheapest + 2 most expensive services
 */
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

/**
 * Get default services for platform-only queries
 */
function getDefaultServices(services, platform) {
    if (!services || !services.length || !platform) return [];
    
    const platformLower = platform.toLowerCase();
    const defaultNames = DEFAULT_SERVICES[platformLower] || [];
    
    // Try to find matching services by name
    let defaultMatches = services.filter(svc => 
        defaultNames.some(defaultName => 
            svc.name && svc.name.includes(defaultName.substring(0, 30))
        )
    );
    
    // If not enough matches, get any services from platform
    if (defaultMatches.length < 5) {
        const platformKeywords = PLATFORM_KEYWORDS[platformLower] || [platformLower];
        const platformServices = services.filter(svc => {
            const name = normalize(svc.name || "");
            return platformKeywords.some(kw => name.includes(kw));
        });
        
        // Sort by popularity (using service ID as proxy) and take top 5
        const sorted = platformServices.sort((a, b) => a.service - b.service);
        defaultMatches = sorted.slice(0, 5);
    }
    
    return defaultMatches.slice(0, 5);
}

function createServiceItem(service, index) {
    const emoji = numberToEmoji(index + 1);
    const priceDisplay = formatPriceDisplay(service);
    
    // Return full unmodified service name
    return `${emoji} *${service.name}*\n` +
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
        customcomments: 'CUSTOM COMMENTS',
        randomcomments: 'RANDOM COMMENTS',
        emojicomments: 'EMOJI COMMENTS',
        livestreamviews: 'LIVE STREAM VIEWS',
        watchhours: 'WATCH HOURS',
        adwords: 'ADWORDS VIEWS',
        ctrviews: 'CTR VIEWS',
        socialshares: 'SOCIAL SHARES'
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

            // Check if it's a service query
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

            console.log('\n📊 [SERVICE DETECTION] ==================');
            console.log('📝 Query    :', text);
            console.log('📱 Platform :', platform || '❌ Not detected');
            console.log('🎯 Service  :', service || '❌ Not detected');
            console.log('========================================\n');

            // Handle platform-only queries
            if (platform && !service) {
                const defaultServices = getDefaultServices(services, platform);
                
                if (defaultServices.length > 0) {
                    let messageText = "╭━━━〔 🎯 *POPULAR SERVICES* 〕━━━━╮\n\n";
                    
                    const platformEmoji = {
                        tiktok: '🎵', instagram: '📷', facebook: '👤',
                        youtube: '▶️', whatsapp: '💬'
                    }[platform] || '📱';
                    
                    messageText += `${platformEmoji} *Platform:* ${platform.toUpperCase()}\n`;
                    messageText += `✨ *Showing:* Popular ${platform} services\n`;
                    messageText += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                    
                    defaultServices.forEach((svc, idx) => {
                        messageText += createServiceItem(svc, idx) + "\n\n";
                    });
                    
                    messageText += `💡 *Tip:* Be more specific! Try "${platform} likes" or "${platform} views"\n\n`;
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
                    
                    console.log(`✅ [AI PLUGIN] Sent ${defaultServices.length} default ${platform} services to ${from}`);
                    return;
                }
            }

            // Handle incomplete queries
            if (!platform || !service) {
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

            // Filter by category
            let filtered = filterByCategory(services, platform, service);
            
            console.log(`🔍 Category filter: found ${filtered.length} ${service} services for ${platform}`);

            // If no results, try platform only
            if (filtered.length === 0) {
                console.log(`ℹ️ No ${service} services found, showing ${platform} services`);
                filtered = filterByCategory(services, platform, null);
            }

            // Get 3 cheapest + 2 most expensive
            const selectedServices = getPriceExtremes(filtered);

            if (selectedServices.length === 0) {
                await conn.sendMessage(from, { 
                    text: `❌ No ${platform} ${service} services found. Please try a different combination.` 
                }, { quoted: mek });
                return;
            }

            // Build response with full service names
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
                postlikes: '👍', channelmembers: '👥', customcomments: '💭',
                randomcomments: '🎲', emojicomments: '😊', livestreamviews: '🔴',
                watchhours: '⏰', adwords: '📊', ctrviews: '📈',
                socialshares: '🔄'
            }[service] || '🎯';
            
            messageText += `${platformEmoji} *Platform:* ${platform.toUpperCase()}\n`;
            messageText += `${serviceEmoji} *Service:* ${formatServiceType(service)}\n`;
            
            // Show category if available
            if (filtered.length > 0 && filtered[0].category) {
                messageText += `📁 *Category:* ${filtered[0].category}\n`;
            }
            
            messageText += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            selectedServices.forEach((svc, idx) => {
                messageText += createServiceItem(svc, idx) + "\n\n";
            });

            messageText += `💡 *Showing:* 3 cheapest + 2 most expensive ${platform} ${service} services\n\n`;
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

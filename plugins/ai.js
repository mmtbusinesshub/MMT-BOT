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
    'instagram', 'ig', 'insta', 'facebook', 'fb', 'tiktok', 'tt', 'tik',
    'youtube', 'yt', 'tube', 'whatsapp', 'wa',
    
    // Core service types
    'follower', 'followers', 'fans', 'like', 'likes', 'heart', 'reaction', 'reactions',
    'view', 'views', 'plays', 'watch', 'comment', 'comments', 'reply',
    'share', 'shares', 'repost', 'save', 'saves', 'bookmark',
    'story', 'stories', 'live', 'stream', 'subscriber', 'subscribers', 'subs',
    'member', 'members', 'channel', 'watchtime', 'watch time', 'watch hours', 'hours',
    'group', 'groups', 'poll', 'votes', 'video', 'videos', 'post', 'posts',
    'page', 'pages', 'reel', 'reels', 'impression', 'impressions', 'reach', 'emoji',
    
    // PAGE-SPECIFIC TRIGGERS
    // General page triggers
    'page', 'pages', 'fan page', 'business page', 'official page',
    
    // Page follower triggers
    'page followers', 'page follower', 'fan page followers',
    'page fans', 'page fan', 'page audience',
    
    // Page like triggers
    'page likes', 'page like', 'fan page likes',
    'page reactions', 'page reaction',
    
    // Page view triggers
    'page views', 'page view', 'page visits',
    'page traffic', 'page visitors',
    
    // Page engagement triggers
    'page engagement', 'page interactions',
    'page comments', 'page comment',
    'page shares', 'page share',
    'page saves', 'page save',
    
    // Page reach triggers
    'page reach', 'page impressions',
    'page visibility', 'page exposure',
    
    // FACEBOOK PAGE SPECIFIC
    'facebook page', 'fb page', 'meta page',
    'facebook page likes', 'fb page likes',
    'facebook page followers', 'fb page followers',
    'facebook page fans', 'fb page fans',
    
    // INSTAGRAM PAGE/PROFILE SPECIFIC
    'instagram page', 'ig page', 'insta page',
    'instagram profile', 'ig profile',
    'profile views', 'profile visits',
    'profile followers', 'profile likes',
    
    // YOUTUBE PAGE/CHANNEL SPECIFIC
    'youtube page', 'yt page',
    'youtube channel', 'yt channel',
    'channel views', 'channel visits',
    'channel subscribers', 'channel subs',
    
    // TIKTOK PAGE/PROFILE SPECIFIC
    'tiktok page', 'tt page',
    'tiktok profile', 'tt profile',
    'profile followers',
    
    // POST-SPECIFIC (different from page)
    'post likes', 'post like',
    'post comments', 'post comment',
    'post shares', 'post share',
    'post reactions', 'post reaction',
    'post views', 'post view',
    'post saves', 'post save',
    'post impressions', 'post reach',
    
    // COMBINED PAGE + POST
    'page and post', 'page & post',
    'page likes + followers', 'page likes and followers',
    'page engagement package',
    
    // ENHANCED WHATSAPP CHANNEL TRIGGERS
    // Channel members variations
    'channel members', 'channel member', 'members', 'subscribers',
    
    // Channel reactions variations
    'channel reactions', 'channel reaction', 'post reactions', 'post reaction',
    'emoji reactions', 'emoji reaction', 'emojis',
    
    // Specific emoji triggers
    '👍', 'thumbs up', 'thumbsup',
    '❤️', 'heart', 'love',
    '😂', 'laugh', 'haha', 'laughing',
    '😲', 'wow', 'surprised', 'shocked',
    '😥', 'sad', 'cry', 'crying',
    '🙏', 'pray', 'thankful', 'thanks',
    '👏', 'clap', 'applause', 'clapping',
    '🔥', 'fire', 'hot', 'trending',
    '🏆', 'trophy', 'winner', 'champion',
    '🎉', 'party', 'celebrate', 'celebration',
    
    // Mixed reactions
    'mixed reactions', 'random reactions', 'mix emoji',
    
    // Channel posts
    'channel posts', 'channel post', 'post emoji',
    
    // Channel targeting
    'global channel', 'worldwide channel', 'targeted channel',
    'country channel', 'specific channel',
    
    // Country-specific channel triggers
    'india channel', 'indian channel',
    'usa channel', 'us channel', 'america channel',
    'arab channel', 'saudi channel',
    'turkey channel', 'turkish channel',
    'europe channel', 'european channel',
    'brazil channel', 'brazilian channel',
    'pakistan channel', 'pakistani channel',
    'philippines channel', 'filipino channel',
    'vietnam channel', 'vietnamese channel',
    'thailand channel', 'thai channel',
    'nigeria channel', 'nigerian channel',
    'indonesia channel', 'indonesian channel',
    
    // Channel speed/quality
    'fast channel', 'instant channel', 'quick channel',
    'cheap channel', 'cheapest channel',
    'slow channel', 'slow server',
    
    // Channel duration
    'lifetime channel', 'permanent channel',
    
    // Comprehensive WhatsApp combinations
    'whatsapp channel', 'wa channel',
    'channel emoji', 'emoji channel',
    'channel reactions', 'reactions channel',
    'channel members', 'members channel',
    
    // Individual reaction types with context
    'like reaction', 'heart reaction', 'love reaction',
    'laugh reaction', 'haha reaction',
    'wow reaction', 'surprised reaction',
    'sad reaction', 'cry reaction',
    'pray reaction', 'thank you reaction',
    'clap reaction', 'applause reaction',
    'fire reaction', 'hot reaction',
    'trophy reaction', 'winner reaction',
    'party reaction', 'celebrate reaction'
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
    channel: ['channel', 'channels'],
    reactions: ['reaction', 'reactions', 'emoji', 'emojis'],
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
    watchtimeviews: ['watch time views'],
    videoviews: ['video views'],
    videosave: ['video save'],
    videoshare: ['video share'],
    livestreamviews: ['live stream views'],
    randomcomments: ['random comments'],
    emojicomments: ['emoji comments'],
    customcomments: ['custom comments'],
    
    // PAGE-SPECIFIC KEYWORDS (Facebook Pages, etc.)
    pagefollowers: ['page followers', 'page follower', 'fan page followers'],
    pagelikes: ['page likes', 'page like', 'fan page likes'],
    pageviews: ['page views', 'page view', 'page visits'],
    pagecomments: ['page comments', 'page comment'],
    pageshares: ['page shares', 'page share'],
    pagereactions: ['page reactions', 'page reaction'],
    pageengagement: ['page engagement', 'page interactions'],
    pageimpressions: ['page impressions', 'page reach'],
    pagementions: ['page mentions', 'mentions'],
    pagecheckins: ['page checkins', 'check ins'],
    pagetags: ['page tags', 'tags'],
    
    // FACEBOOK PAGE SPECIFIC
    facebookpage: ['facebook page', 'fb page', 'meta page'],
    facebookpagelikes: ['facebook page likes', 'fb page likes', 'meta page likes'],
    facebookpagefollowers: ['facebook page followers', 'fb page followers', 'meta page followers'],
    facebookpagereviews: ['page reviews', 'ratings'],
    
    // PAGE + FOLLOWERS/LIKES COMBINATIONS
    pagefans: ['page fans', 'fan page'],
    pagelikesplusfollowers: ['page likes + followers', 'page likes and followers'],
    
    // POST-SPECIFIC (different from page)
    postlikes: ['post likes', 'post like'],
    postcomments: ['post comments', 'post comment'],
    postshares: ['post shares', 'post share'],
    postreactions: ['post reactions', 'post reaction'],
    postviews: ['post views', 'post view'],
    postimpressions: ['post impressions', 'post reach'],
    postsaves: ['post saves', 'post save'],
    
    // INSTAGRAM PAGE/PROFILE SPECIFIC
    instagrampage: ['instagram page', 'ig page', 'insta page', 'profile'],
    instagramprofile: ['instagram profile', 'ig profile', 'profile views'],
    profileviews: ['profile views', 'profile visit'],
    profilevisits: ['profile visits'],
    
    // YOUTUBE PAGE/CHANNEL SPECIFIC
    youtubechannel: ['youtube channel', 'yt channel', 'channel page'],
    channelviews: ['channel views', 'channel visits'],
    channelsubscribers: ['channel subscribers', 'channel subs'],
    
    // TIKTOK PAGE/PROFILE SPECIFIC
    tiktokprofile: ['tiktok profile', 'tt profile'],
    profilefollowers: ['profile followers'],
    
    // WHATSAPP CHANNEL (already had)
    channelmembers: ['channel members', 'channel member', 'members', 'channel subscribers'],
    channelreactions: ['channel reactions', 'channel reaction', 'post reactions'],
    channelemojireactions: ['channel emoji reactions', 'channel emoji reaction'],
    postemojireactions: ['post emoji reactions', 'post emoji reaction'],
    
    // SPECIFIC EMOJI REACTIONS
    emojireactions: ['emoji reactions', 'emoji reaction', 'reactions'],
    likeemoji: ['like emoji', '👍', 'thumbs up'],
    heartemoji: ['heart emoji', '❤️', 'love'],
    laughingemoji: ['laughing emoji', '😂', 'haha'],
    surprisedemoji: ['surprised emoji', '😲', 'wow'],
    sademoji: ['sad emoji', '😥', 'sad'],
    prayingemoji: ['praying emoji', '🙏', 'pray'],
    clapemoji: ['clap emoji', '👏', 'clapping'],
    fireemoji: ['fire emoji', '🔥', 'fire'],
    trophyemoji: ['trophy emoji', '🏆', 'trophy'],
    partyemoji: ['party emoji', '🎉', 'party'],
    
    // MIXED EMOJI REACTIONS
    mixedemojireactions: ['mixed emoji reactions', 'mix reactions', 'random mix'],
    randomemojireactions: ['random emoji reactions', 'random reactions'],
    
    // WHATSAPP CHANNEL QUALITY/SPEED
    fastreactions: ['fast reactions', 'quick reactions'],
    instantreactions: ['instant reactions', 'instant emoji'],
    cheapreactions: ['cheap reactions', 'cheapest reactions'],
    slowreactions: ['slow reactions', 'slow server'],
    
    // WHATSAPP CHANNEL TARGETING
    globalchannel: ['global channel', 'worldwide channel'],
    targetedchannel: ['targeted channel', 'country specific'],
    
    // WHATSAPP CHANNEL SPECIFIC COUNTRIES
    indiachannel: ['india channel', 'indian members'],
    usachannel: ['usa channel', 'american members'],
    arabchannel: ['arab channel', 'arab members'],
    turkeychannel: ['turkey channel', 'turkish members'],
    europechannel: ['europe channel', 'european members'],
    brazilchannel: ['brazil channel', 'brazilian members'],
    pakistanchannel: ['pakistan channel', 'pakistani members'],
    philippineschannel: ['philippines channel', 'filipino members'],
    vietnamchannel: ['vietnam channel', 'vietnamese members'],
    thailandchannel: ['thailand channel', 'thai members'],
    nigerianchannel: ['nigeria channel', 'nigerian members'],
    
    // WHATSAPP CHANNEL POSTS
    channelposts: ['channel posts', 'channel post'],
    channelviews: ['channel views', 'post views'],
    
    // WHATSAPP CHANNEL DURATION
    channelinstant: ['channel instant', 'instant channel'],
    channelfast: ['channel fast', 'fast channel'],
    channellifetime: ['channel lifetime', 'lifetime channel'],
    
    // WHATSAPP CHANNEL PRICE POINTS
    cheapertiemoji: ['cheaper emoji', 'cheapest emoji'],
    cheapertiemojireactions: ['cheaper emoji reactions', 'cheapest reactions'],
    
    // WHATSAPP CHANNEL SERVER TYPES
    fastserver: ['fast server', 'fast completion'],
    slowserver: ['slow server', 'slow completion'],
    
    // COMPREHENSIVE WHATSAPP CHANNEL
    whatsappchannel: ['whatsapp channel', 'wa channel'],
    channelemoji: ['channel emoji', 'emoji channel'],
    channelpost: ['channel post', 'post reactions'],
    
    // INDIVIDUAL EMOJI REACTIONS VERBOSE
    thumbsup: ['thumbs up', 'thumbsup', '👍'],
    love: ['love', '❤️', 'heart reaction'],
    laugh: ['laugh', '😂', 'haha reaction'],
    wow: ['wow', '😲', 'surprised'],
    sad: ['sad', '😥', 'crying'],
    pray: ['pray', '🙏', 'thank you'],
    clap: ['clap', '👏', 'applause'],
    hot: ['hot', '🔥', 'fire reaction'],
    winner: ['winner', '🏆', 'champion'],
    celebrate: ['celebrate', '🎉', 'party reaction']
};

// COMPLETE CATEGORY LISTS from your services.json
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

// Category to service type mapping
const CATEGORY_SERVICE_MAP = {
    // TikTok mappings
    'Tiktok Followers [ Recommended ⭐ ] ᴺᴱᵂ': 'followers',
    'TikTok Followers [ Updated 01.02.2026 ] ᴺᴱᵂ': 'followers',
    'TikTok Followers [ 100% Real Accounts ] [ Emergency 🚨 ] ᴺᴱᵂ': 'followers',
    'TikTok Followers [ ♻️ Auto Refill / Best Working ⭐ ] ᴺᴱᵂ': 'followers',
    'Tiktok Followers [ 100% Real Accounts With Posts ] ᴺᴱᵂ': 'followers',
    'Tiktok Followers [ Non Drop 🎖️ ] ᴺᴱᵂ': 'followers',
    'TikTok Followers [ Targeted ]': 'followers',
    'TikTok Followers [ Targeted ] [ HQ ]': 'followers',
    'TikTok Followers [ Targeted ] [ 365 Days ♻️ ]': 'followers',
    'Tiktok Followers [ Saudi Arabia 🇸🇦 ]': 'followers',
    
    'TikTok Likes [ Accounts with Profile Photos ] ᴺᴱᵂ': 'likes',
    'TikTok Likes [ HQ Accounts ] [ Auto Refill ♻️ ] ᴺᴱᵂ': 'likes',
    'TikTok Likes [ Drop 0% ] ᴺᴱᵂ': 'likes',
    'TikTok Likes [ Super Fast 🚀 ] [ Cheapest 💥] ᴺᴱᵂ': 'likes',
    'Tiktok Likes': 'likes',
    'Tiktok Likes ♻️': 'likes',
    
    'TikTok Video Views [ Best Price 💫 ] ᴺᴱᵂ': 'videoviews',
    'TikTok Video Views [ Lowest Price 💥 ] ᴺᴱᵂ': 'videoviews',
    'Tiktok Video Views [ Cheapest 💥] [ Fast 🚀 ] ᴺᴱᵂ': 'videoviews',
    'Tiktok Video Views [ Auto Refill ♻️ ] ᴺᴱᵂ': 'videoviews',
    'TikTok Video Views [ Drop 0% ] ᴺᴱᵂ': 'videoviews',
    'TikTok Video Views [ Drop 0% ] [ ⚙️ Auto Refill ♻️ ] ᴺᴱᵂ': 'videoviews',
    'TikTok Video Views [ Cheapest 💥 ] ᴺᴱᵂ': 'videoviews',
    'Tiktok Video Views': 'videoviews',
    
    'TikTok Comments [ Cheapest Working 💫 ] ᴺᴱᵂ': 'comments',
    'TikTok Comments [ Custom ]': 'customcomments',
    
    'TikTok Video Save [ Cheapest 💥] ᴺᴱᵂ': 'videosave',
    'TikTok Video Save ᴺᴱᵂ': 'videosave',
    
    'Tiktok Video Share ᴺᴱᵂ': 'videoshare',
    'TikTok Video Share': 'videoshare',
    'TikTok Reposts ᴺᴱᵂ': 'reposts',
    
    'TikTok Live Stream Views + [ Like + Share ]': 'livestreamviews',
    
    // Instagram mappings
    'Instagram Followers [ 100% Real Accounts ] ᴺᴱᵂ': 'followers',
    'Instagram Followers [ Cheapest Price 💫 ] ᴺᴱᵂ': 'followers',
    'Instagram Followers [ 100% Real Accounts With Posts ] ᴺᴱᵂ': 'followers',
    'Instagram Followers [ 100% Old Accounts ] [ Cheapest 💥] ᴺᴱᵂ': 'followers',
    'Instagram Real Followers [ Old Accounts ] [ No Refill ⚠️ ]': 'followers',
    'Instagram Real Followers [ Old Accounts ] [ Lifetime ♻️ ]': 'followers',
    'Instagram Followers [ Likes + Story Views + Profile Views ] [ Old Accounts ]': 'followers',
    
    'Instagram Likes [ Accounts with Profile Photos ] ᴺᴱᵂ': 'likes',
    'Instagram Likes [ 100% Real Accounts ] [ Best Price 💫 ] ᴺᴱᵂ': 'likes',
    'Instagram Likes [ 100% Active and Real Accounts ] ᴺᴱᵂ': 'likes',
    'Instagram Likes [ Old Accounts ] [ Stable ✨ ] ᴺᴱᵂ': 'likes',
    'Instagram Services [ Best Price 💫 ] ᴺᴱᵂ': 'likes',
    'Instagram Likes [ Cheapest 💫 ] ᴺᴱᵂ': 'likes',
    'Instagram Likes [ Drop 0% ] ᴺᴱᵂ': 'likes',
    'Instagram Likes [ India 🇮🇳 ] [ Drop 0% ] ᴺᴱᵂ': 'likes',
    'Instagram Likes [ Slow Working ] ᴺᴱᵂ': 'likes',
    'Instagram Likes [ Auto ⚙️]': 'likes',
    
    'Instagram Story Views [ Targeted ] ᴺᴱᵂ': 'storyviews',
    'Instagram Story Comments [Random] [Verified Accounts]': 'storycomments',
    'Instagram Story Poll Votes': 'storypoll',
    
    'Instagram Comments [ Cheapest 💥] ᴺᴱᵂ': 'comments',
    'Instagram Comments [ Recommended ⭐ ] ᴺᴱᵂ': 'comments',
    'Instagram Comments [ Best Price 💫 ] ᴺᴱᵂ': 'comments',
    'Instagram Comments [ Custom ]': 'customcomments',
    
    'Instagram Video Views [ Cheapest 💥] ᴺᴱᵂ': 'videoviews',
    'Instagram Video Views': 'videoviews',
    
    'Instagram Save': 'saves',
    'Instagram Impression Services': 'impressions',
    'Instagram Channel Member [ Targeted ] [ Cheapest ]': 'channelmember',
    'Instagram Repost': 'repost',
    
    // Facebook mappings
    'Facebook Followers [ Best Price 💫 ] ᴺᴱᵂ': 'followers',
    'Facebook Followers [ Hidden Accounts ] [ Cheapest 💥 ] ᴺᴱᵂ': 'followers',
    'Facebook Followers [ Cheapest 💥] ᴺᴱᵂ': 'followers',
    
    'Facebook Post Likes [ Best Price 💫 ] ᴺᴱᵂ': 'postlikes',
    'Facebook Post Likes [ Cheapest 💥 ] ᴺᴱᵂ': 'postlikes',
    'Facebook Page Likes + Followers [ Cheapest 💥 ] ᴺᴱᵂ': 'pagelikes',
    'Facebook Page Likes + Followers [ Cheapest 💫 ] ᴺᴱᵂ': 'pagelikes',
    'Facebook Page Likes': 'pagelikes',
    
    'Facebook Post Reactions [ Best Price 💫 ] ᴺᴱᵂ': 'postreactions',
    'Facebook Post Reactions [ Cheapest 💫 ] ᴺᴱᵂ': 'postreactions',
    'Facebook | Post Reactions - Guaranteed ♻️ | High Speed': 'postreactions',
    
    'Facebook Group Members [ Cheapest 💥] ᴺᴱᵂ': 'groupmembers',
    'Facebook Live Stream Views [ 100% Concurrent ] [ Cheapest 💥 ] ᴺᴱᵂ': 'livestreamviews',
    'Facebook Comments [ Best Price 💫 ] ᴺᴱᵂ': 'comments',
    'Facebook Comments': 'comments',
    'Facebook Views [ Video / Reels ] ᴺᴱᵂ': 'videoviews',
    'Facebook Story Reactions [ Cheapest 💫 ] ᴺᴱᵂ': 'storyreactions',
    'Facebook Story Views': 'storyviews',
    'Facebook Story Reactions': 'storyreactions',
    'Facebook Watch Time Views [ 60K Minutes ] [ Lifetime ♻️ ] ᴺᴱᵂ': 'watchtimeviews',
    
    // YouTube mappings
    'Youtube Views [ Best ⭐ ] ᴺᴱᵂ': 'views',
    'Youtube Views [ Recommended ⭐ ] ᴺᴱᵂ': 'views',
    'Youtube Views [ Recommended 🎖️] ᴺᴱᵂ': 'views',
    'Youtube Views [ 100% Real Quality Views ] ♻️ ᴺᴱᵂ': 'views',
    'YouTube Views [ CTR Search ] ᴺᴱᵂ': 'ctrviews',
    'YouTube Views [ Native Ads ]': 'views',
    'Youtube Views ♻️': 'views',
    'Youtube Adwords Views [ 100% Real Views ] ᴺᴱᵂ': 'adwords',
    
    'Youtube Subscribers [ Fastest Service 🚀 ] ᴺᴱᵂ': 'subscribers',
    'Youtube Subscribers [ Update Working ] ᴺᴱᵂ': 'subscribers',
    'Youtube Subscribers ⚠️': 'subscribers',
    'Youtube Subscribers ♻️': 'subscribers',
    'Youtube Subscribers | Targeted ♻️': 'subscribers',
    
    'Youtube Likes ♻️': 'likes',
    
    'YouTube Custom Comments Reply ᴺᴱᵂ': 'customcomments',
    'YouTube Comment Reply Likes ᴺᴱᵂ': 'comments',
    'YouTube Video/Shorts Comments Created by AI 🤖 ᴺᴱᵂ': 'comments',
    'YouTube Video/Shorts Comment Likes ᴺᴱᵂ': 'comments',
    'YouTube Live Stream Custom Chat Comments ᴺᴱᵂ': 'customcomments',
    'Youtube Comments [ Custom ]': 'customcomments',
    'Youtube Comments Likes': 'comments',
    
    'YouTube Watch Time Views ᴺᴱᵂ': 'watchtime',
    'Youtube Watch Time Views ᴺᴱᵂ': 'watchtime',
    'YouTube WatchTime [ 100% Google Ads ]': 'watchtime',
    'YouTube Watch Hours [ 100% Stabil ]': 'watchhours',
    'YouTube Watch Hours': 'watchhours',
    
    'YouTube Live Stream Views + Likes [ 100% Concurrent ] ᴺᴱᵂ': 'livestreamviews',
    'YouTube Live Stream Views': 'livestreamviews',
    'YouTube Live Stream Reaction': 'livestreamviews',
    
    'YouTube Shares [ Choose Speed ] ᴺᴱᵂ': 'socialshares',
    'YouTube Shares [ Choose GEO ] ᴺᴱᵂ': 'socialshares',
    'YouTube Shares [ Choose Referrer ] ᴺᴱᵂ': 'socialshares',
    
    'YouTube Services [ 100% Real ] ᴺᴱᵂ': 'views',
    'YouTube Hype Boost [ Provider ] ᴺᴱᵂ': 'views',
    'Youtube | %100 Organic Services': 'views',
    
    // WhatsApp mappings
    'Whatsapp Channel Member [ Cheapest 💥] ᴺᴱᵂ': 'channelmembers',
    'Whatsapp Channel Members [ Cheapest ]': 'channelmembers',
    'Whatsapp Channel Members [ Targeted ]': 'channelmembers',
    'Whatsapp Channel Emoji Reactions [ Cheap Slow Server ]': 'emojireactions'
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
 * Check if service is primary (appears in first few words)
 */
function isPrimaryService(service, platform, serviceType) {
    const name = normalize(service.name || "");
    const platformKeywords = PLATFORM_KEYWORDS[platform] || [platform];
    const serviceKeywords = SERVICE_KEYWORDS[serviceType] || [serviceType];
    
    // Get first 8 words of service name
    const words = name.split(' ').slice(0, 8);
    
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
 * Filter services by category using complete category lists
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
    const serviceKeywords = serviceLower ? (SERVICE_KEYWORDS[serviceLower] || [serviceLower]) : [];
    
    // Filter services
    let filtered = services.filter(svc => {
        const category = svc.category || "";
        const normalizedCategory = normalize(category);
        
        // Platform must match in category
        if (platformKeywords) {
            const hasPlatformInCategory = platformKeywords.some(kw => 
                normalizedCategory.includes(kw)
            );
            if (!hasPlatformInCategory) return false;
        }
        
        // If we have platform categories and service specified, check if category matches service type
        if (platformCategories.length > 0 && serviceLower) {
            // Check if this category is in our platform's category list
            const isInPlatformCategory = platformCategories.some(cat => 
                normalize(cat) === normalizedCategory || 
                normalize(cat).includes(normalizedCategory) ||
                normalizedCategory.includes(normalize(cat).substring(0, 20))
            );
            
            if (isInPlatformCategory) {
                // Check if this category maps to the requested service type
                const mappedService = CATEGORY_SERVICE_MAP[category];
                if (mappedService && mappedService === serviceLower) {
                    return true;
                }
                // If no direct mapping, check if category contains service keyword
                if (serviceKeywords.length > 0) {
                    return serviceKeywords.some(kw => normalizedCategory.includes(kw));
                }
            }
            return false;
        }
        
        return true;
    });
    
    // If we have platform and service but no results, try matching by service keywords
    if (filtered.length === 0 && platformLower && serviceLower) {
        const serviceKeywords = SERVICE_KEYWORDS[serviceLower] || [serviceLower];
        
        filtered = services.filter(svc => {
            const category = normalize(svc.category || "");
            const name = normalize(svc.name || "");
            
            // Platform must match
            if (platformKeywords) {
                const hasPlatformInCategory = platformKeywords.some(kw => category.includes(kw));
                const hasPlatformInName = platformKeywords.some(kw => name.includes(kw));
                if (!hasPlatformInCategory && !hasPlatformInName) return false;
            }
            
            // Service must match
            const hasServiceInCategory = serviceKeywords.some(kw => category.includes(kw));
            const hasServiceInName = serviceKeywords.some(kw => name.includes(kw));
            
            return hasServiceInCategory || hasServiceInName;
        });
    }
    
    // Apply primary service check for more accurate results
    if (platformLower && serviceLower && filtered.length > 3) {
        filtered = filtered.filter(svc => 
            isPrimaryService(svc, platformLower, serviceLower)
        );
    }
    
    return filtered;
}

/**
 * Get 3 cheapest + 2 most expensive from services
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
    
    // Return FULL unmodified service name
    return `${emoji} *${service.name}*\n` +
           `${priceDisplay}\n` +
           `📦 Min: ${service.min} | Max: ${service.max}\n` +
           `🔗 https://makemetrend.online/services\n` +
           `────────────────────`;
}

function formatServiceType(service) {
    if (!service) return 'SERVICES';
    
const serviceMap = {
    // Core Services
    followers: 'FOLLOWERS',
    likes: 'LIKES',
    views: 'VIEWS',
    comments: 'COMMENTS',
    shares: 'SHARES',
    saves: 'SAVES',
    
    // Content Types
    story: 'STORY',
    live: 'LIVE',
    video: 'VIDEO',
    post: 'POST',
    page: 'PAGE',
    reel: 'REEL',
    channel: 'CHANNEL',
    group: 'GROUP',
    poll: 'POLL',
    
    // Platform Specific - General
    subscribers: 'SUBSCRIBERS',
    reactions: 'REACTIONS',
    watchtime: 'WATCH TIME',
    impressions: 'IMPRESSIONS',
    reach: 'REACH',
    discover: 'DISCOVER',
    repost: 'REPOST',
    
    // Video Related
    videoviews: 'VIDEO VIEWS',
    videosave: 'VIDEO SAVE',
    videoshare: 'VIDEO SHARE',
    livestreamviews: 'LIVE STREAM VIEWS',
    watchhours: 'WATCH HOURS',
    watchtimeviews: 'WATCH TIME VIEWS',
    retention: 'RETENTION',
    
    // Story Related
    storyviews: 'STORY VIEWS',
    storyreactions: 'STORY REACTIONS',
    storycomments: 'STORY COMMENTS',
    storypoll: 'STORY POLL',
    
    // Post & Page Related
    pagelikes: 'PAGE LIKES',
    postlikes: 'POST LIKES',
    postreactions: 'POST REACTIONS',
    
    // Group Related
    groupmembers: 'GROUP MEMBERS',
    
    // Comment Related
    customcomments: 'CUSTOM COMMENTS',
    randomcomments: 'RANDOM COMMENTS',
    emojicomments: 'EMOJI COMMENTS',
    
    // WhatsApp Specific - Channel
    channelmembers: 'CHANNEL MEMBERS',
    channelmember: 'CHANNEL MEMBER',
    channelreactions: 'CHANNEL REACTIONS',
    channelposts: 'CHANNEL POSTS',
    channelviews: 'CHANNEL VIEWS',
    
    // WhatsApp Specific - Emoji Reactions (Detailed)
    emojireactions: 'EMOJI REACTIONS',
    emojireaction: 'EMOJI REACTION',
    postemojireactions: 'POST EMOJI REACTIONS',
    channelemojireactions: 'CHANNEL EMOJI REACTIONS',
    
    // WhatsApp Specific - Individual Emojis
    likeemoji: '👍 EMOJI REACTIONS',
    heartemoji: '❤️ EMOJI REACTIONS',
    laughingemoji: '😂 EMOJI REACTIONS',
    surprisedemoji: '😲 EMOJI REACTIONS',
    sademoji: '😥 EMOJI REACTIONS',
    prayingemoji: '🙏 EMOJI REACTIONS',
    clapemoji: '👏 EMOJI REACTIONS',
    fireemoji: '🔥 EMOJI REACTIONS',
    trophyemoji: '🏆 EMOJI REACTIONS',
    partyemoji: '🎉 EMOJI REACTIONS',
    
    // WhatsApp Specific - Mixed Emojis
    mixedemojireactions: 'MIXED EMOJI REACTIONS',
    randomemojireactions: 'RANDOM EMOJI REACTIONS',
    
    // WhatsApp Specific - Quality & Speed
    fastreactions: 'FAST EMOJI REACTIONS',
    instantreactions: 'INSTANT EMOJI REACTIONS',
    cheapertiemojireactions: 'CHEAP EMOJI REACTIONS',
    slowserverreactions: 'SLOW SERVER EMOJI REACTIONS',
    
    // YouTube Specific
    adwords: 'ADWORDS VIEWS',
    ctrviews: 'CTR VIEWS',
    socialshares: 'SOCIAL SHARES',
    hypes: 'HYPE BOOST',
    
    // Instagram Specific
    profilevisit: 'PROFILE VISIT',
    instagramchannel: 'INSTAGRAM CHANNEL',
    
    // Facebook Specific
    watchtimeviews: 'WATCH TIME VIEWS',
    
    // TikTok Specific
    reposts: 'REPOSTS',
    
    // Package Types
    package: 'PACKAGE',
    growthpackage: 'GROWTH PACKAGE',
    premiumpackage: 'PREMIUM PACKAGE',
    
    // Quality Indicators
    real: 'REAL ACCOUNTS',
    hq: 'HIGH QUALITY',
    lq: 'LOW QUALITY',
    active: 'ACTIVE ACCOUNTS',
    
    // Refill Options
    autorefill: 'AUTO REFILL',
    norefill: 'NO REFILL',
    refill: 'REFILL',
    
    // Speed Indicators
    instant: 'INSTANT',
    fast: 'FAST',
    ultrafast: 'ULTRA FAST',
    superfast: 'SUPER FAST',
    
    // Cancel Options
    cancel: 'CANCEL ENABLE',
    cancelenable: 'CANCEL ENABLE',
    
    // Drop Rate
    drop: 'DROP',
    nondrop: 'NON DROP',
    lowdrop: 'LOW DROP',
    highdrop: 'HIGH DROP',
    dropzero: '0% DROP',
    
    // Regional/Targeted
    targeted: 'TARGETED',
    global: 'GLOBAL',
    worldwide: 'WORLDWIDE',
    
    // Country Specific
    usa: 'USA',
    india: 'INDIA',
    brazil: 'BRAZIL',
    turkey: 'TURKEY',
    arab: 'ARAB',
    europe: 'EUROPE',
    asia: 'ASIA',
    latinamerica: 'LATIN AMERICA',
    uae: 'UAE',
    pakistan: 'PAKISTAN',
    philippines: 'PHILIPPINES',
    vietnam: 'VIETNAM',
    thailand: 'THAILAND',
    nigeria: 'NIGERIA',
    indonesia: 'INDONESIA',
    saudi: 'SAUDI ARABIA',
    egypt: 'EGYPT',
    russia: 'RUSSIA',
    germany: 'GERMANY',
    france: 'FRANCE',
    uk: 'UNITED KINGDOM',
    canada: 'CANADA',
    japan: 'JAPAN',
    korea: 'SOUTH KOREA',
    
    // Time Duration
    minutes: 'MINUTES',
    hours: 'HOURS',
    days: 'DAYS',
    lifetime: 'LIFETIME',
    
    // Max Limits
    unlimited: 'UNLIMITED',
    max: 'MAX',
    min: 'MIN'
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
                await conn.sendMessage(from, { react: { text: "💫", key: mek.key } });
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

            // Filter by category using complete category lists
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
                filtered = filterByName(services, platform, null);
            }

            // Get 3 cheapest + 2 most expensive
            const selectedServices = getPriceExtremes(filtered);

            if (selectedServices.length === 0) {
                await conn.sendMessage(from, { 
                    text: `❌ No ${platform} ${service} services found. Please try a different combination.` 
                }, { quoted: mek });
                return;
            }

            // Build response with FULL service names
            let messageText = "╭━━〔 🎯 *MMT SERVICES* 〕━━╮\n";
            messageText += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;

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
                videoviews: '🎬', storyviews: '📖', storyreactions: '😊',
                storycomments: '💬', storypoll: '📊', pagelikes: '👍',
                postlikes: '👍', postreactions: '❤️', groupmembers: '👥',
                channelmembers: '👥', customcomments: '💭', randomcomments: '🎲',
                emojicomments: '😊', livestreamviews: '🔴', watchhours: '⏰',
                adwords: '📊', ctrviews: '📈', socialshares: '🔄',
                impressions: '👁️', reach: '📡', discover: '🔍',
                repost: '🔄', reposts: '🔄', videosave: '💾',
                videoshare: '📤', emojireactions: '😊', channelmember: '👤',
                profilevisit: '👤', watchtimeviews: '⏱️'
            }[service] || '🎯';
            
            messageText += `${platformEmoji} *Platform:* ${platform.toUpperCase()}\n`;
            messageText += `${serviceEmoji} *Service:* ${formatServiceType(service)}\n`;
            
            // Show full category name
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
            messageText += `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

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

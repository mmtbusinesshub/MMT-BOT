const axios = require("axios");

let lkrToUsd = 0.0033;
let lkrToInr = 0.29;

/* ============================================================
   PLATFORM + SERVICE KEYWORDS
============================================================ */

const PLATFORM_KEYWORDS = {
    tiktok: ['tiktok', 'tt', 'tik tok'],
    instagram: ['instagram', 'ig', 'insta'],
    facebook: ['facebook', 'fb', 'meta'],
    youtube: ['youtube', 'yt'],
    whatsapp: ['whatsapp', 'wa']
};

const SERVICE_KEYWORDS = {
    followers: ['followers', 'follower', 'fans'],
    subscribers: ['subscribers', 'subs'],
    likes: ['likes', 'like', 'hearts'],
    views: ['views', 'view', 'plays'],
    comments: ['comments', 'comment', 'replies'],
    shares: ['shares', 'share', 'repost'],
    saves: ['saves', 'save', 'bookmark'],
    reactions: ['reaction', 'reactions', 'emoji'],
    members: ['members', 'member'],
    watchtime: ['watchtime', 'watch hours', 'hours'],
    poll: ['poll', 'vote', 'votes']
};

const TARGET_KEYWORDS = [
    'page', 'post', 'story', 'reel',
    'shorts', 'live', 'channel',
    'group', 'profile', 'comment'
];

/* ============================================================
   UTIL FUNCTIONS
============================================================ */

function normalize(text) {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/* ============================================================
   EXCHANGE RATE SYSTEM
============================================================ */

async function updateExchangeRates() {
    try {
        const usd = await axios.get("https://api.exchangerate.host/latest?base=LKR&symbols=USD");
        const inr = await axios.get("https://api.exchangerate.host/latest?base=LKR&symbols=INR");

        if (usd.data?.rates?.USD) lkrToUsd = usd.data.rates.USD;
        if (inr.data?.rates?.INR) lkrToInr = inr.data.rates.INR;

        console.log("💱 Exchange rates updated");
    } catch (err) {
        console.log("⚠️ Exchange rate update failed");
    }
}

updateExchangeRates();
setInterval(updateExchangeRates, 12 * 60 * 60 * 1000);

/* ============================================================
   PRICE FUNCTIONS
============================================================ */

function extractLKRPrice(priceStr) {
    if (!priceStr) return 0;
    const match = String(priceStr).match(/([\d,.]+)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
}

function convertFromLKR(lkr) {
    return {
        lkr,
        usd: lkr * lkrToUsd,
        inr: lkr * lkrToInr
    };
}

function format(num) {
    return num ? num.toFixed(2) : "0.00";
}

/* ============================================================
   SMART DETECTION ENGINE
============================================================ */

function detectSMMIntent(query) {
    const text = normalize(query);

    let intent = {
        platform: null,
        service: null,
        target: null,
        matchType: "none"
    };

    // PLATFORM
    for (const [platform, words] of Object.entries(PLATFORM_KEYWORDS)) {
        if (words.some(w => text.includes(w))) {
            intent.platform = platform;
            break;
        }
    }

    // SERVICE
    for (const [type, words] of Object.entries(SERVICE_KEYWORDS)) {
        if (words.some(w => text.includes(w))) {
            intent.service = type;
            break;
        }
    }

    // TARGET
    for (const t of TARGET_KEYWORDS) {
        if (text.includes(t)) {
            intent.target = t;
            break;
        }
    }

    // Smart conversion
    if (intent.platform === "youtube" && intent.service === "followers") {
        intent.service = "subscribers";
    }

    if (intent.platform && intent.service && intent.target)
        intent.matchType = "ultra-specific";
    else if (intent.platform && intent.service)
        intent.matchType = "platform+service";
    else if (intent.platform)
        intent.matchType = "platform-only";
    else if (intent.service)
        intent.matchType = "service-only";

    return intent;
}

/* ============================================================
   SERVICE CLASSIFIER
============================================================ */

function classifyService(service) {
    const text = normalize(service.name + " " + (service.category || ""));

    let data = { platform: null, service: null, target: null };

    for (const [platform, words] of Object.entries(PLATFORM_KEYWORDS)) {
        if (words.some(w => text.includes(w))) {
            data.platform = platform;
            break;
        }
    }

    for (const [type, words] of Object.entries(SERVICE_KEYWORDS)) {
        if (words.some(w => text.includes(w))) {
            data.service = type;
            break;
        }
    }

    for (const t of TARGET_KEYWORDS) {
        if (text.includes(t)) {
            data.target = t;
            break;
        }
    }

    return data;
}

/* ============================================================
   FILTER ENGINE
============================================================ */

function filterServices(services, intent) {
    return services.filter(service => {
        const classified = classifyService(service);

        if (intent.platform && classified.platform !== intent.platform)
            return false;

        if (intent.service && classified.service !== intent.service)
            return false;

        if (intent.target && classified.target !== intent.target)
            return false;

        return true;
    });
}

/* ============================================================
   TOP SERVICES SELECTOR
============================================================ */

function getTopServices(services) {
    const sorted = [...services].sort((a, b) =>
        extractLKRPrice(a.price) - extractLKRPrice(b.price)
    );

    return sorted.slice(0, 5);
}

/* ============================================================
   RESPONSE BUILDER
============================================================ */

function createServiceItem(service, index) {
    const price = extractLKRPrice(service.price);
    const converted = convertFromLKR(price);

    return `*${index + 1}. ${service.name}*\n` +
        `💰 LKR: Rs. ${price}\n` +
        `💵 USD: $${format(converted.usd)}\n` +
        `🆔 ID: ${service.service_id}\n` +
        `📦 Min: ${service.min} | Max: ${service.max}\n` +
        `────────────────────`;
}

/* ============================================================
   MAIN EXPORT
============================================================ */

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            const text =
                mek.message?.conversation ||
                mek.message?.extendedTextMessage?.text ||
                "";

            if (!text) return;

            const services = await global.mmtServices.getServices();
            if (!services?.length) return;

            const intent = detectSMMIntent(text);
            let filtered = filterServices(services, intent);

            if (filtered.length === 0 && intent.platform) {
                filtered = services.filter(s =>
                    classifyService(s).platform === intent.platform
                );
            }

            if (filtered.length === 0) {
                filtered = services.slice(0, 10);
            }

            const selected = getTopServices(filtered);

            let message = `╭━━━〔 🎯 *SMM SERVICES* 〕━━━━╮\n\n`;

            if (intent.platform)
                message += `📱 Platform: ${intent.platform.toUpperCase()}\n`;
            if (intent.service)
                message += `🎯 Service: ${intent.service.toUpperCase()}\n`;
            if (intent.target)
                message += `📌 Target: ${intent.target.toUpperCase()}\n`;

            message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            selected.forEach((s, i) => {
                message += createServiceItem(s, i) + "\n\n";
            });

            message += `📞 Support: wa.me/94722136082\n`;
            message += `🌐 Website: https://makemetrend.online\n`;
            message += `╰━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            await conn.sendMessage(mek.key.remoteJid, {
                text: message
            }, { quoted: mek });

        } catch (err) {
            console.error("AI Plugin Error:", err);
        }
    }
};

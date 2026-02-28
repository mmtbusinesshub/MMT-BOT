// plugins/welcome.js
const fs = require('fs');
const path = require('path');
const { sendInteractiveMessage } = require('gifted-btns');

const channelJid = '120363423526129509@newsletter';
const channelName = 'ミ★ 𝙈𝙈𝙏 𝘽𝙐𝙎𝙄𝙉𝙀𝙎𝙎 𝙃𝙐𝘽 ★彡';
const serviceLogo = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/download.png?raw=true";

// File to store user data
const WELCOME_DATA_FILE = path.join(__dirname, '../welcome_data.json');

// 30 days in milliseconds
const WELCOME_RESET_DAYS = 30;
const WELCOME_RESET_MS = WELCOME_RESET_DAYS * 24 * 60 * 60 * 1000;

// Load or initialize welcome data
let welcomeData = {};
try {
    if (fs.existsSync(WELCOME_DATA_FILE)) {
        welcomeData = JSON.parse(fs.readFileSync(WELCOME_DATA_FILE, 'utf8'));
        console.log(`📂 [WELCOME PLUGIN] Loaded welcome data for ${Object.keys(welcomeData).length} users`);
    }
} catch (err) {
    console.error('❌ [WELCOME PLUGIN] Error loading welcome data:', err);
}

// Save welcome data to file
function saveWelcomeData() {
    try {
        fs.writeFileSync(WELCOME_DATA_FILE, JSON.stringify(welcomeData, null, 2));
    } catch (err) {
        console.error('❌ [WELCOME PLUGIN] Error saving welcome data:', err);
    }
}

// Check if user needs welcome message
function needsWelcome(userJid) {
    const now = Date.now();
    const userData = welcomeData[userJid];
    
    // If no data, needs welcome
    if (!userData) return true;
    
    // Check if 30 days have passed since last welcome
    if (now - userData.lastWelcome > WELCOME_RESET_MS) {
        return true;
    }
    
    return false;
}

// Mark user as welcomed
function markWelcomed(userJid) {
    welcomeData[userJid] = {
        lastWelcome: Date.now(),
        firstSeen: welcomeData[userJid]?.firstSeen || Date.now()
    };
    saveWelcomeData();
}

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            const key = mek.key;
            const content = mek.message;
            
            // Ignore status broadcasts and own messages
            if (key.remoteJid === 'status@broadcast' || key.fromMe) return;
            
            const from = key.remoteJid;
            const sender = key.participant || from;
            
            // Only for 1-on-1 chats (not groups)
            if (from.endsWith('@g.us')) return;
            
            // Check if user needs welcome
            if (!needsWelcome(sender)) return;
            
            console.log(`👋 [WELCOME PLUGIN] Sending welcome to new user: ${sender}`);
            
            // Send typing indicator
            await conn.sendPresenceUpdate('composing', from);
            
            // Small delay to make it feel natural
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Welcome message with all features (removed text links since we'll use buttons)
            const welcomeCaption = `
╭━〔 🎉 *WELCOME TO MMT* 〕━╮
┃━━━━━━━━━━━━━━━━━━━━━
┃ 👋 *Hello! Thanks for messaging us!*
┃ 🤖 *I'm your AI Business Assistant*
┃━━━━━━━━━━━━━━━━━━━━━━━
┃ 📌 *WHAT YOU CAN GET HERE:*
┃
┃ 💳 *BANK DETAILS*
┃ • Type *bank details* to see all payment methods
┃ • HNB, BOC, EZ Cash, Binance Pay
┃
┃ 🚀 *SERVICE DETAILS*
┃ • Type *tiktok followers* 
┃ • Type *instagram likes*
┃ • Type *facebook page views*
┃ • Type *youtube subscribers*
┃ • Type *whatsapp channel*
┃
┃ 👑 *ADMIN DETAILS*
┃ • Type *admin details* for contact info
┃ • Support team ready to help
┃
┃ 🌐 *HOSTING DETAILS*
┃ • Type *hosting* to see our plans
┃ • Fast & reliable web hosting
╰━━━━━━━━━━━━━━━━━━━━━━━╯

💫 *We're here to help grow your business!*`;

            // Send welcome message with logo AND buttons
            await sendInteractiveMessage(conn, from, {
                image: { url: serviceLogo },
                title: "🎉 WELCOME TO MMT BUSINESS HUB",
                text: welcomeCaption,
                footer: "Choose an option below:",
                interactiveButtons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🌐 Visit Website',
                            url: 'https://makemetrend.online'
                        })
                    },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📞 Contact Support',
                            url: 'https://wa.me/94771056082'
                        })
                    },

                    {
    name: 'cta_url',
    buttonParamsJson: JSON.stringify({
        display_text: '👥 Join Our Group',
        url: 'https://chat.whatsapp.com/FSyiJnvAyaLH6wyDuW6aYy?mode=gi_t'
    })
},
{
    name: 'cta_url',
    buttonParamsJson: JSON.stringify({
        display_text: '📢 Follow Our Channel',
        url: 'https://whatsapp.com/channel/0029Vb6MCIz3LdQMnBdE7B0N'
    })
}
                ]
            }, { quoted: mek });
            
            // Mark user as welcomed
            markWelcomed(sender);
            
            console.log(`✅ [WELCOME PLUGIN] Welcome sent to ${sender} with buttons`);
            
        } catch (err) {
            console.error("❌ [WELCOME PLUGIN] Error:", err);
        }
    }
};

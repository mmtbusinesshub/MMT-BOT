const fs = require('fs');
const path = require('path');
const { sendInteractiveMessage } = require('gifted-btns');

const channelJid = '120363423526129509@newsletter';
const channelName = 'ミ★ 𝙈𝙈𝙏 𝘽𝙐𝙎𝙄𝙉𝙀𝙎𝙎 𝙃𝙐𝘽 ★彡';
const serviceLogo = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/download.png?raw=true";

// Your specific group and channel JIDs
const YOUR_GROUP_JID = '120363407450693131@g.us'; // REPLACE WITH YOUR ACTUAL GROUP JID
const YOUR_CHANNEL_JID = '120363427927272922@newsletter'; // Your channel JID

const WELCOME_DATA_FILE = path.join(__dirname, '../welcome_data.json');

const WELCOME_RESET_DAYS = 30;
const WELCOME_RESET_MS = WELCOME_RESET_DAYS * 24 * 60 * 60 * 1000;

let welcomeData = {};
try {
    if (fs.existsSync(WELCOME_DATA_FILE)) {
        welcomeData = JSON.parse(fs.readFileSync(WELCOME_DATA_FILE, 'utf8'));
        console.log(`📂 [WELCOME PLUGIN] Loaded welcome data for ${Object.keys(welcomeData).length} users`);
    }
} catch (err) {
    console.error('❌ [WELCOME PLUGIN] Error loading welcome data:', err);
}

function saveWelcomeData() {
    try {
        fs.writeFileSync(WELCOME_DATA_FILE, JSON.stringify(welcomeData, null, 2));
    } catch (err) {
        console.error('❌ [WELCOME PLUGIN] Error saving welcome data:', err);
    }
}

function needsWelcome(userJid) {
    const now = Date.now();
    const userData = welcomeData[userJid];
    
    if (!userData) return true;
    
    if (now - userData.lastWelcome > WELCOME_RESET_MS) {
        return true;
    }
    
    return false;
}

function markWelcomed(userJid) {
    welcomeData[userJid] = {
        lastWelcome: Date.now(),
        firstSeen: welcomeData[userJid]?.firstSeen || Date.now()
    };
    saveWelcomeData();
}

// Function to get time-based greeting
function getTimeGreeting() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
        return "🌅 Good Morning";
    } else if (hour >= 12 && hour < 17) {
        return "☀️ Good Afternoon";
    } else if (hour >= 17 && hour < 20) {
        return "🌆 Good Evening";
    } else {
        return "🌃 Good Night";
    }
}

// Function to extract user name
function getUserName(mek) {
    return mek.pushName || 'there';
}

// Handle group participant updates
async function handleGroupParticipantUpdate(conn, update) {
    try {
        const { id, participants, action } = update;
        
        // Only process for your specific group
        if (id !== YOUR_GROUP_JID) return;
        
        // Only process when users are added
        if (action !== 'add') return;
        
        for (const participantJid of participants) {
            // Check if user needs welcome (30-day reset)
            if (!needsWelcome(participantJid)) continue;
            
            // Get user info
            let userName = 'there';
            try {
                const userInfo = await conn.onWhatsApp(participantJid);
                if (userInfo[0]?.name) {
                    userName = userInfo[0].name;
                }
            } catch {}
            
            const greeting = getTimeGreeting();
            
            const welcomeMessage = `╭━〔 🎉 *WELCOME TO THE GROUP* 〕━╮
┃━━━━━━━━━━━━━━━━━━━━━
┃ ${greeting}, *${userName}!* 
┃
┃ 👋 *Welcome to MMT Business Hub!*
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

            // Send welcome to the group mentioning the user
            await conn.sendMessage(id, {
                text: welcomeMessage,
                mentions: [participantJid]
            });
            
            // Mark as welcomed
            markWelcomed(participantJid);
            console.log(`✅ [WELCOME PLUGIN] Sent group welcome to ${participantJid}`);
        }
    } catch (err) {
        console.error("❌ [WELCOME PLUGIN] Error in group participant update:", err);
    }
}

// Handle channel updates (follows)
async function handleChannelUpdate(conn, update) {
    try {
        // This would need to be implemented based on how channel follows are detected
        // WhatsApp doesn't provide direct event for channel follows yet
        console.log("📢 [WELCOME PLUGIN] Channel update detected");
    } catch (err) {
        console.error("❌ [WELCOME PLUGIN] Error in channel update:", err);
    }
}

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            const key = mek.key;
            const content = mek.message;
            
            if (key.remoteJid === 'status@broadcast' || key.fromMe) return;
            
            const from = key.remoteJid;
            const sender = key.participant || from;
            
            // Handle group messages differently
            if (from.endsWith('@g.us')) {
                // For groups, only process if it's your specific group
                if (from !== YOUR_GROUP_JID) return;
                
                // Check if this is a new user joining (this will be handled by group-participants.update event)
                // So we don't process here
                return;
            }
            
            // For 1-on-1 chats (regular users messaging bot first time)
            if (!needsWelcome(sender)) return;
            
            console.log(`👋 [WELCOME PLUGIN] Sending welcome to new user: ${sender}`);
            
            await conn.sendPresenceUpdate('composing', from);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const userName = getUserName(mek);
            const greeting = getTimeGreeting();
            
            const welcomeCaption = `
╭━〔 🎉 *WELCOME TO MMT* 〕━╮
┃━━━━━━━━━━━━━━━━━━━━━
┃ ${greeting}, *${userName}!*
┃
┃ 👋 *Thanks for messaging us!*
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
                            url: 'https://chat.whatsapp.com/FSyiJnvAyaLH6wyDuW6aYy'
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
            
            markWelcomed(sender);
            
            console.log(`✅ [WELCOME PLUGIN] Welcome sent to ${sender} with buttons`);
            
        } catch (err) {
            console.error("❌ [WELCOME PLUGIN] Error:", err);
        }
    },
    
    // This will be called by the main index.js for group participant updates
    onGroupParticipantUpdate: async (conn, update) => {
        await handleGroupParticipantUpdate(conn, update);
    }
};

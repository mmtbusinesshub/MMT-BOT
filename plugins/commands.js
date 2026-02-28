// plugins/commands.js
const { cmd } = require('../command');

cmd({
    pattern: "commands",
    desc: "Show all bot commands and their usage (Owner only)",
    category: "owner",
    filename: __filename
},
async (sock, mek, m, {
    from,
    isOwner,
    reply
}) => {
    try {
        // 🔒 Owner check
        if (!isOwner) {
            return reply("❌ *This command is only for bot owners!*");
        }

        const commandsList = `╭━━〔 📚 *MMT BOT COMMANDS* 〕━━╮
┃
┃ 🎯 *MAIN COMMANDS*
┃ ━━━━━━━━━━━━━━━━━
┃ • .ping - Check if bot is alive
┃   └ Example: .ping
┃
┃ • .commands - Show this help
┃   └ Example: .commands
┃
┃ 💳 *PAYMENT & BANKING*
┃ ━━━━━━━━━━━━━━━━━
┃ • Type "bank details" - Show payment methods
┃   └ Example: bank
┃
┃ 🚀 *SERVICE TRIGGERS*
┃ ━━━━━━━━━━━━━━━━━
┃ • Type "tiktok followers" - Get TikTok services
┃   └ Example: tiktok followers
┃
┃ • Type "tiktok likes" - Get TikTok likes
┃   └ Example: tiktok likes
┃
┃ • Type "instagram followers" - Get IG followers
┃   └ Example: instagram followers
┃
┃ • Type "instagram likes" - Get IG likes
┃   └ Example: instagram likes
┃
┃ • Type "facebook followers" - Get FB followers
┃   └ Example: facebook followers
┃
┃ • Type "facebook page likes" - Get page likes
┃   └ Example: facebook page likes
┃
┃ • Type "youtube subscribers" - Get YT subs
┃   └ Example: youtube subscribers
┃
┃ • Type "youtube views" - Get YT views
┃   └ Example: youtube views
┃
┃ • Type "whatsapp channel" - Get WA channel services
┃   └ Example: whatsapp channel
┃
┃ • Type "whatsapp channel members" - Get channel members
┃   └ Example: whatsapp channel members
┃
┃ 🌐 *HOSTING*
┃ ━━━━━━━━━━━━━━━━━
┃ • Type "hosting" - View hosting plans
┃   └ Example: hosting
┃
┃ 👑 *OWNER COMMANDS*
┃ ━━━━━━━━━━━━━━━━━
┃ • .system - Open system control panel
┃   └ Example: .system
┃
┃ • .system mode <public/private/inbox>
┃   └ Change bot mode
┃   └ Examples: 
┃      • .system mode public
┃      • .system mode private
┃      • .system mode inbox
┃
┃ • .system aliveimg <url>
┃   └ Update alive image
┃   └ Example: .system aliveimg https://example.com/image.jpg
┃
┃ • .system alivemsg <message>
┃   └ Update alive message
┃   └ Example: .system alivemsg I'm alive and working!
┃
┃ • .system addowner <number>
┃   └ Add new bot owner
┃   └ Example: .system addowner 94771234567
┃
┃ • .system removeowner <number>
┃   └ Remove bot owner
┃   └ Example: .system removeowner 94771234567
┃
┃ • .system botowner <number>
┃   └ Set main bot owner
┃   └ Example: .system botowner 94771234567
┃
┃ 👥 *GROUP MANAGEMENT*
┃ ━━━━━━━━━━━━━━━━━
┃ • .system addgroup <jid>
┃   └ Add group to allowed list
┃   └ Example: .system addgroup 120363407450693131@g.us
┃
┃ • .system removegroup <jid>
┃   └ Remove group from allowed list
┃   └ Example: .system removegroup 120363407450693131@g.us
┃
┃ • .system listgroups
┃   └ Show all allowed groups
┃   └ Example: .system listgroups
┃
┃ • .system cleargroups
┃   └ Remove all allowed groups
┃   └ Example: .system cleargroups
┃
┃ • .groupjid
┃   └ Get JID of your groups (select from menu)
┃   └ Example: .groupjid
┃
┃ • .groupadd <numbers>
┃   └ Add users to group
┃   └ Examples:
┃      • .groupadd +94776121326
┃      • .groupadd +94776121326, +94774915917
┃      • .groupadd +94776121326, +94774915917, +94771234567
┃
┃ 🔄 *AUTO STATUS CONTROLS*
┃ ━━━━━━━━━━━━━━━━━
┃ • .system autoseen <true/false>
┃   └ Auto mark status as seen
┃   └ Examples:
┃      • .system autoseen true
┃      • .system autoseen false
┃
┃ • .system autoreact <true/false>
┃   └ Auto react to status
┃   └ Examples:
┃      • .system autoreact true
┃      • .system autoreact false
┃
┃ • .system autoreply <true/false>
┃   └ Auto reply to status
┃   └ Examples:
┃      • .system autoreply true
┃      • .system autoreply false
┃
┃ 🔑 *API CONFIGURATION*
┃ ━━━━━━━━━━━━━━━━━
┃ • .system apikey <new_key>
┃   └ Update MMT API key
┃   └ Example: .system apikey 529e5c3a2253bf93a5d9c2e104a3b498
┃
┃ ⚙️ *SYSTEM CONTROL*
┃ ━━━━━━━━━━━━━━━━━
┃ • .restart - Restart the bot
┃   └ Example: .restart
╰━━━━━━━━━━━━━━━━━━━━━━╯

💡 *Tips:*
• Commands with "." are exact commands that need to be typed exactly
• Words without "." are triggers that work when the message starts with them
• Owner commands only work for bot owners
• Use .system alone to see the full control panel
• For group adds, make sure numbers include country code (+)

*• To add members to groups follow this flow.* 
  *get group jid using .groupjid plugin and select the group you want the jid*
  *from the button menu. it gives you a copy button to copy the group jid*
  *and after getting group jid use .system addgroup (paste the copied jid)*
  *after that it will add your group to the bot system and after that*
  *use .groupadd (add numbers you want like .groupadd +94776121326, +94774915917, +94771234567)*
  *after that bot will add that members to your group.*
`;

        await sock.sendMessage(from, {
            text: commandsList
        }, { quoted: mek });

    } catch (err) {
        console.log("Commands Plugin Error:", err);
        reply(`❌ Error: ${err.message}`);
    }
});

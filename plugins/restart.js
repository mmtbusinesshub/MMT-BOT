const { cmd, commands } = require('../command');
const config = require('../config');

cmd({
    pattern: "restart",
    desc: "Restart the bot (Owner only)",
    category: "owner",
    filename: __filename
},
async (danuwamd, mek, m, {
    from, quoted, body, isCmd, command, args, q, isGroup,
    sender, senderNumber, botNumber2, botNumber, pushname,
    isMe, isOwner, groupMetadata, groupName, participants,
    groupAdmins, isBotAdmins, isAdmins, reply
}) => {
    try {
        // Check if user is owner
        if (!isOwner) {
            return reply("❌ *This command is only for bot owners!*");
        }

        // Send confirmation message
        await reply("🔄 *Restarting bot...*\n\nBot will be back online in a few seconds.");

        console.log(`🔄 [SYSTEM] Restart initiated by ${senderNumber}`);

        // Small delay to ensure message is sent
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Exit process - the process manager (PM2, forever, etc.) will restart it
        process.exit(0);

    } catch (e) {
        console.log(e);
        reply(`❌ *Error:* ${e.message}`);
    }
});

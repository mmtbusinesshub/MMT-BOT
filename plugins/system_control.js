// plugins/system_control.js
const { cmd, commands } = require('../command');
const config = require('../config');
const { spawn } = require('child_process');

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
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Restart the bot process
        process.on('exit', () => {
            spawn(process.argv.shift(), process.argv, {
                cwd: process.cwd(),
                detached: true,
                stdio: 'inherit'
            });
        });
        
        process.exit();

    } catch (e) {
        console.log(e);
        reply(`❌ *Error:* ${e.message}`);
    }
});

cmd({
    pattern: "shutdown",
    desc: "Shutdown the bot completely (Owner only)",
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

        // Send shutdown message
        await reply("🛑 *Shutting down bot...*\n\nBot will not restart automatically. Start manually when needed.");

        console.log(`🛑 [SYSTEM] Shutdown initiated by ${senderNumber}`);

        // Small delay to ensure message is sent
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Exit process without spawning new one
        process.exit();

    } catch (e) {
        console.log(e);
        reply(`❌ *Error:* ${e.message}`);
    }
});

const { cmd } = require('../command');

cmd({
    pattern: "groupjid",
    desc: "Get group JIDs (Owner only - Private use)",
    category: "owner",
    filename: __filename
},
async (danuwamd, mek, m, {
    from, isGroup, isOwner, reply
}) => {
    try {

        // Owner check
        if (!isOwner) {
            return reply("❌ *This command is only for bot owners!*");
        }

        // Must be used in private chat
        if (isGroup) {
            return reply("❌ *Use this command in private chat only!*");
        }

        // Get all groups bot participates in
        const groups = await danuwamd.groupFetchAllParticipating();

        if (!groups || Object.keys(groups).length === 0) {
            return reply("❌ Bot is not in any groups.");
        }

        let caption = `╭━━〔 📌 GROUP JID LIST 〕━━╮\n┃\n`;

        let index = 1;
        for (let jid in groups) {
            caption += `┃ ${index}. ${groups[jid].subject}\n`;
            caption += `┃    🆔 ${jid}\n┃\n`;
            index++;
        }

        caption += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n🔒 Owner Only`;

        await reply(caption);

    } catch (e) {
        console.log(e);
        reply(`❌ *Error:* ${e.message}`);
    }
});

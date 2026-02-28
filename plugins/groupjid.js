const { cmd } = require('../command');

cmd({
    pattern: "groupjid",
    desc: "Get current group JID (Owner only)",
    category: "owner",
    filename: __filename
},
async (danuwamd, mek, m, {
    from, isGroup, isOwner, groupMetadata, reply
}) => {
    try {

        // Owner check
        if (!isOwner) {
            return reply("❌ *This command is only for bot owners!*");
        }

        // Must be used inside a group
        if (!isGroup) {
            return reply("❌ *This command can only be used inside a group!*");
        }

        const groupName = groupMetadata.subject;
        const groupJid = from;

        let caption = `
╭━━〔 📌 GROUP JID FINDER 〕━━╮
┃
┃ 🏷️ *Group Name:*
┃ ${groupName}
┃
┃ 🆔 *Group JID:*
┃ ${groupJid}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

📋 Copy the JID carefully.
🔒 Owner Only Command
`;

        await reply(caption);

    } catch (e) {
        console.log(e);
        reply(`❌ *Error:* ${e.message}`);
    }
});

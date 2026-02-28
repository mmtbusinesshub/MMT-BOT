const { cmd } = require('../command');
const { sendInteractiveMessage } = require('gifted-btns');

// Temporary memory store per user
const groupCache = new Map();

cmd({
    pattern: "groupjid",
    desc: "Interactive Group JID Finder (Owner only)",
    category: "owner",
    filename: __filename
},
async (sock, mek, m, {
    from,
    sender,
    isOwner,
    isGroup,
    reply
}) => {
    try {

        // 🔒 Owner check
        if (!isOwner) {
            return reply("❌ This command is only for bot owners.");
        }

        // ❌ Must use in private chat
        if (isGroup) {
            return reply("❌ Use this command in private chat.");
        }

        // Fetch groups
        const groups = await sock.groupFetchAllParticipating();

        if (!groups || Object.keys(groups).length === 0) {
            return reply("❌ Bot is not participating in any groups.");
        }

        // Store groups per owner session
        groupCache.set(sender, groups);

        let rows = [];

        for (let jid in groups) {
            rows.push({
                title: groups[jid].subject,
                description: `Members: ${groups[jid].participants.length}`,
                id: `selectjid_${jid}`
            });
        }

        // Send interactive single select
        await sendInteractiveMessage(sock, from, {
            text: "📌 Select a group to get its JID",
            footer: "MMT Business Hub • Owner Panel",
            interactiveButtons: [
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "Choose Group",
                        sections: [
                            {
                                title: "Your Groups",
                                rows: rows
                            }
                        ]
                    })
                }
            ]
        });

    } catch (err) {
        console.log(err);
        reply(`❌ Error: ${err.message}`);
    }
});

const { cmd } = require('../command');
const { sendInteractiveMessage } = require('gifted-btns');

// Temporary cache per owner session
const groupCache = new Map();

/* =======================================================
   🔥 MAIN COMMAND
======================================================= */

cmd({
    pattern: "groupjid",
    desc: "Interactive Group JID Finder (Owner only)",
    category: "owner",
    filename: __filename
},
async (sock, mek, m, {
    from,
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

        const groups = await sock.groupFetchAllParticipating();

        if (!groups || Object.keys(groups).length === 0) {
            return reply("❌ Bot is not participating in any groups.");
        }

        // ✅ Store using m.sender (important fix)
        groupCache.set(m.sender, groups);

        let rows = [];

        for (let jid in groups) {
            rows.push({
                title: groups[jid].subject,
                description: `Members: ${groups[jid].participants.length}`,
                id: `selectjid_${jid}`
            });
        }

        await sendInteractiveMessage(sock, from, {
            text: "📌 *Select a group to get its JID*",
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
        }, { quoted: mek });

    } catch (err) {
        console.log("GroupJID Command Error:", err);
        reply(`❌ Error: ${err.message}`);
    }
});


/* =======================================================
   🔥 INTERACTIVE RESPONSE HANDLER
======================================================= */

cmd({
    on: "message"
},
async (sock, mek, m) => {

    try {

        if (!m.message?.interactiveResponseMessage) return;

        const response =
            m.message.interactiveResponseMessage.nativeFlowResponseMessage;

        if (!response?.paramsJson) return;

        const parsed = JSON.parse(response.paramsJson);
        const selectedId = parsed.id;

        if (!selectedId || !selectedId.startsWith("selectjid_")) return;

        const groupJid = selectedId.replace("selectjid_", "");

        // ✅ Always use m.sender for cache retrieval
        const groups = groupCache.get(m.sender);
        if (!groups) return;

        const group = groups[groupJid];
        if (!group) return;

        await sendInteractiveMessage(sock, m.key.remoteJid, {
            text: `📌 *${group.subject}*\n\nBelow is the Group JID:`,
            footer: "Tap copy button below",
            interactiveButtons: [
                {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                        display_text: "📋 Copy Group JID",
                        copy_code: groupJid
                    })
                }
            ]
        }, { quoted: mek });

    } catch (err) {
        console.log("Interactive handler error:", err);
    }
});

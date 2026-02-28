const { cmd } = require('../command');
const { sendInteractiveMessage } = require('gifted-btns');

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

        const groups = await sock.groupFetchAllParticipating();

        if (!groups || Object.keys(groups).length === 0) {
            return reply("❌ Bot is not participating in any groups.");
        }

        // Store session cache
        groupCache.set(sender, groups);

        let rows = [];

        for (let jid in groups) {
            rows.push({
                title: groups[jid].subject,
                description: `Members: ${groups[jid].participants.length}`,
                id: `selectjid_${jid}`
            });
        }

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


/* =======================================================
   🔥 INTERACTIVE RESPONSE HANDLER (INSIDE SAME PLUGIN)
======================================================= */

cmd({
    on: "message"
},
async (sock, mek, m, {
    sender
}) => {

    try {

        if (!m.message?.interactiveResponseMessage) return;

        const response =
            m.message.interactiveResponseMessage.nativeFlowResponseMessage;

        if (!response?.paramsJson) return;

        const parsed = JSON.parse(response.paramsJson);
        const selectedId = parsed.id;

        if (!selectedId || !selectedId.startsWith("selectjid_")) return;

        const groupJid = selectedId.replace("selectjid_", "");

        const groups = groupCache.get(sender);
        if (!groups || !groups[groupJid]) return;

        const group = groups[groupJid];

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
        });

    } catch (err) {
        console.log("Interactive handler error:", err);
    }
});

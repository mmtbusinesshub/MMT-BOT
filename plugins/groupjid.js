const { cmd } = require('../command');
const { sendInteractiveMessage } = require('gifted-btns');

// Temporary cache per owner session
const groupCache = new Map();

// Helper to extract body from interactive response
function extractBody(mek, m) {
    const type = Object.keys(mek.message || {})[0];
    return (type === 'conversation') ? mek.message.conversation :
           (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text :
           (type === 'templateButtonReplyMessage') ? mek.message.templateButtonReplyMessage?.selectedId :
           (type === 'interactiveResponseMessage') ? (() => {
              try {
                  const json = JSON.parse(
                      mek.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
                  );
                  return json?.id || '';
              } catch { return ''; }
           })() :
           (type === 'imageMessage') ? mek.message.imageMessage?.caption :
           (type === 'videoMessage') ? mek.message.videoMessage?.caption :
           m.msg?.text ||
           m.msg?.conversation ||
           m.msg?.caption ||
           m.msg?.selectedButtonId ||
           m.msg?.singleSelectReply?.selectedRowId ||
           '';
}

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
    reply,
    sender
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

        // ✅ Store using sender
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

        // Handle the response immediately after sending
        const body = extractBody(mek, m);
        
        // Check if this is a response to our selection
        if (body && body.startsWith("selectjid_")) {
            const groupJid = body.replace("selectjid_", "");
            
            // Get groups from cache
            const cachedGroups = groupCache.get(sender);
            if (!cachedGroups) {
                return reply("❌ Session expired. Please run .groupjid again.");
            }

            const group = cachedGroups[groupJid];
            if (!group) return;

            // Send the JID with copy button
            await sendInteractiveMessage(sock, from, {
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
        }

    } catch (err) {
        console.log("GroupJID Command Error:", err);
        reply(`❌ Error: ${err.message}`);
    }
});

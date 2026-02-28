// plugins/groupjid.js
const { cmd } = require('../command');
const { sendInteractiveMessage } = require('gifted-btns');

// Temporary cache per owner session
const groupCache = new Map();

const channelJid = '120363423526129509@newsletter';
const channelName = 'ミ★ 𝙈𝙈𝙏 𝘽𝙐𝙎𝙄𝙉𝙀𝙎𝙎 𝙃𝙐𝘽 ★彡';
const serviceLogo = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/download.png?raw=true";

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

        // Store groups in cache with sender as key
        groupCache.set(sender, {
            groups: groups,
            timestamp: Date.now()
        });

        let rows = [];

        for (let jid in groups) {
            rows.push({
                title: groups[jid].subject,
                description: `Members: ${groups[jid].participants.length}`,
                id: `groupjid_${jid}`
            });
        }

        // Send the interactive menu
        await sendInteractiveMessage(sock, from, {
            image: { url: serviceLogo },
            title: "👥 GROUP JID FINDER",
            text: "📌 *Select a group to get its JID*\n\nChoose from the menu below:",
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
   🔥 BUTTON RESPONSE HANDLER - This gets called by index.js
======================================================= */

module.exports.onButtonResponse = async (conn, msg, selectedId, from) => {
    try {
        console.log("🔘 [GROUPJID] Button clicked:", selectedId);

        // Check if this is a group selection from our command
        if (!selectedId || !selectedId.startsWith("groupjid_")) return;

        const groupJid = selectedId.replace("groupjid_", "");
        
        // Get sender from the message
        const sender = msg.key.participant || msg.key.remoteJid;
        
        // Get groups from cache
        const cached = groupCache.get(sender);
        if (!cached) {
            await conn.sendMessage(from, {
                text: "❌ Session expired. Please run .groupjid again."
            });
            return;
        }

        // Check if cache is expired (5 minutes)
        if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
            groupCache.delete(sender);
            await conn.sendMessage(from, {
                text: "❌ Session expired. Please run .groupjid again."
            });
            return;
        }

        const groups = cached.groups;
        const group = groups[groupJid];
        
        if (!group) {
            await conn.sendMessage(from, {
                text: "❌ Group not found. Please run .groupjid again."
            });
            return;
        }

        // Send the JID with copy button
        await sendInteractiveMessage(conn, from, {
            image: { url: serviceLogo },
            title: "📋 GROUP JID",
            text: `📌 *${group.subject}*\n\n*Group JID:*\n\`${groupJid}\`\n\nTap the button below to copy:`,
            footer: "MMT Business Hub • Owner Panel",
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

        console.log(`✅ [GROUPJID] Sent JID for group: ${group.subject}`);

    } catch (err) {
        console.error("❌ [GROUPJID] Button response error:", err);
    }
};

/* =======================================================
   🔥 CLEANUP OLD CACHE ENTRIES (run every 10 minutes)
======================================================= */

setInterval(() => {
    const now = Date.now();
    for (const [sender, cached] of groupCache.entries()) {
        if (now - cached.timestamp > 5 * 60 * 1000) {
            groupCache.delete(sender);
            console.log(`🧹 [GROUPJID] Cleared expired cache for ${sender}`);
        }
    }
}, 10 * 60 * 1000);

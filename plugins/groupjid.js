// plugins/groupjid.js
const { cmd } = require('../command');
const { sendInteractiveMessage } = require('gifted-btns');

const channelJid = '120363423526129509@newsletter';
const channelName = 'ミ★ 𝙈𝙈𝙏 𝘽𝙐𝙎𝙄𝙉𝙀𝙎𝙎 𝙃𝙐𝘽 ★彡';
const serviceLogo = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/download.png?raw=true";

/* =======================================================
   🔥 MAIN COMMAND
======================================================= */

cmd({
    pattern: "groupjid",
    desc: "Get Group JIDs (Owner only)",
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

        // Fetch all groups the bot is in
        const groups = await sock.groupFetchAllParticipating();

        if (!groups || Object.keys(groups).length === 0) {
            return reply("❌ Bot is not participating in any groups.");
        }

        let rows = [];

        // Create a row for each group
        for (let jid in groups) {
            rows.push({
                title: groups[jid].subject,
                description: `Members: ${groups[jid].participants.length}`,
                id: `groupjid_${jid}`  // Store full JID in the ID
            });
        }

        // Send interactive menu with all groups
        await sendInteractiveMessage(sock, from, {
            image: { url: serviceLogo },
            title: "👥 GROUP JID FINDER",
            text: "📌 *Select a group to get its JID*\n\nChoose from the menu below:",
            footer: "MMT Business Hub • Owner Panel",
            interactiveButtons: [
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "Select Group",
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
   🔥 BUTTON RESPONSE HANDLER
======================================================= */

module.exports.onButtonResponse = async (conn, msg, selectedId, from) => {
    try {
        console.log("🔘 [GROUPJID] Button clicked:", selectedId);

        // Check if this is a group selection
        if (!selectedId || !selectedId.startsWith("groupjid_")) return;

        // Extract the group JID from the selected ID
        const groupJid = selectedId.replace("groupjid_", "");
        
        // Get the group name by fetching groups again
        const groups = await conn.groupFetchAllParticipating();
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

        console.log(`✅ [GROUPJID] Sent JID for: ${group.subject}`);

    } catch (err) {
        console.error("❌ [GROUPJID] Button response error:", err);
    }
};

// plugins/groupadd.js
const { cmd } = require('../command');
const { sendInteractiveMessage } = require('gifted-btns');
const config = require('../config');

const channelJid = '120363423526129509@newsletter';
const channelName = 'ミ★ 𝙈𝙈𝙏 𝘽𝙐𝙎𝙄𝙉𝙀𝙎𝙎 𝙃𝙐𝘽 ★彡';
const serviceLogo = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/download.png?raw=true";

// Temporary storage for pending adds
const pendingAdds = new Map();

/* =======================================================
   🔥 MAIN COMMAND
======================================================= */

cmd({
    pattern: "groupadd",
    desc: "Add participant to a group (Owner only)",
    category: "owner",
    filename: __filename
},
async (sock, mek, m, {
    from,
    isOwner,
    isGroup,
    reply,
    args,
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

        // Check if phone number is provided
        if (args.length === 0) {
            return reply("❌ Please provide a phone number.\n\nExample: `.groupadd +94776121326`");
        }

        // Extract and clean phone number
        let phoneNumber = args[0].replace(/[^0-9+]/g, '');
        
        // Ensure number has + prefix
        if (!phoneNumber.startsWith('+')) {
            phoneNumber = '+' + phoneNumber;
        }

        // Basic validation
        if (phoneNumber.length < 10) {
            return reply("❌ Invalid phone number. Please include country code.\nExample: +94776121326");
        }

        // Get allowed groups from config
        const allowedGroups = config.ALLOWED_GROUPS || [];
        
        if (allowedGroups.length === 0) {
            return reply("❌ No allowed groups found in config. Add groups using `.system addgroup`");
        }

        // Fetch group metadata for each allowed group to get names
        let groupOptions = [];
        
        for (const groupJid of allowedGroups) {
            try {
                const groupMetadata = await sock.groupMetadata(groupJid).catch(() => null);
                if (groupMetadata) {
                    groupOptions.push({
                        title: groupMetadata.subject,
                        description: `Members: ${groupMetadata.participants.length}`,
                        id: `addtogroup_${groupJid}_${phoneNumber}`
                    });
                }
            } catch (err) {
                console.log(`Could not fetch metadata for ${groupJid}:`, err.message);
            }
        }

        if (groupOptions.length === 0) {
            return reply("❌ Could not fetch any group information. Check your allowed groups.");
        }

        // Store pending add
        pendingAdds.set(sender, {
            phoneNumber: phoneNumber,
            timestamp: Date.now()
        });

        // Send group selection menu
        await sendInteractiveMessage(sock, from, {
            image: { url: serviceLogo },
            title: "👥 ADD TO GROUP",
            text: `📱 *Number:* ${phoneNumber}\n\n📌 *Select which group to add this participant:*`,
            footer: "MMT Business Hub • Owner Panel",
            interactiveButtons: [
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "Select Group",
                        sections: [
                            {
                                title: "Available Groups",
                                rows: groupOptions
                            }
                        ]
                    })
                }
            ]
        }, { quoted: mek });

    } catch (err) {
        console.log("GroupAdd Command Error:", err);
        reply(`❌ Error: ${err.message}`);
    }
});

/* =======================================================
   🔥 BUTTON RESPONSE HANDLER
======================================================= */

module.exports.onButtonResponse = async (conn, msg, selectedId, from) => {
    try {
        console.log("🔘 [GROUPADD] Button clicked:", selectedId);

        // Check if this is a group add selection
        if (!selectedId || !selectedId.startsWith("addtogroup_")) return;

        // Parse the selected ID: addtogroup_{groupJid}_{phoneNumber}
        const parts = selectedId.split('_');
        if (parts.length < 3) return;

        const groupJid = parts[1];
        const phoneNumber = parts.slice(2).join('_'); // Rejoin in case number has underscores

        // Get sender from the message
        const sender = msg.key?.participant || msg.key?.remoteJid || from;

        // Verify this is from a pending add (optional, can remove if not needed)
        const pending = pendingAdds.get(sender);
        if (!pending) {
            // Still allow, but log warning
            console.log("⚠️ [GROUPADD] No pending add found for", sender);
        }

        // Clean up phone number (ensure it has @s.whatsapp.net format)
        const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
        const participantJid = cleanNumber.includes('+') 
            ? cleanNumber.replace('+', '') + '@s.whatsapp.net'
            : cleanNumber + '@s.whatsapp.net';

        console.log(`📤 [GROUPADD] Adding ${participantJid} to ${groupJid}`);

        // Send typing indicator
        await conn.sendPresenceUpdate('composing', from);

        // Try to add participant to group
        try {
            const response = await conn.groupParticipantsUpdate(
                groupJid,
                [participantJid],
                'add'
            );

            console.log("Group add response:", response);

            // Get group name for success message
            const groupMetadata = await conn.groupMetadata(groupJid);
            const groupName = groupMetadata.subject;

            // Success message
            await sendInteractiveMessage(conn, from, {
                image: { url: serviceLogo },
                title: "✅ SUCCESS",
                text: `✅ *Successfully added*\n\n📱 *Number:* ${phoneNumber}\n👥 *Group:* ${groupName}\n\n━━━━━━━━━━━━━━━━\n💫 Participant has been added to the group.`,
                footer: "MMT Business Hub • Owner Panel",
                interactiveButtons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '➕ Add Another',
                            id: 'add_another'
                        })
                    }
                ]
            });

            console.log(`✅ [GROUPADD] Added ${phoneNumber} to ${groupName}`);

            // Clear pending add
            pendingAdds.delete(sender);

        } catch (err) {
            console.error("❌ [GROUPADD] Failed to add participant:", err);

            let errorMessage = err.message;

            // Handle common errors
            if (err.message.includes('403')) {
                errorMessage = "❌ *Cannot add participant*\n• User's privacy settings prevent being added\n• User may have left the group recently\n• Try sending them an invite link instead";
            } else if (err.message.includes('already')) {
                errorMessage = "❌ *User is already in the group*";
            } else if (err.message.includes('408')) {
                errorMessage = "❌ *Request timeout*\n• Please try again";
            }

            await conn.sendMessage(from, {
                text: `❌ *Failed to add participant*\n\n📱 *Number:* ${phoneNumber}\n\n${errorMessage}`
            });
        }

    } catch (err) {
        console.error("❌ [GROUPADD] Button response error:", err);
    }
};

/* =======================================================
   🔥 CLEANUP OLD PENDING ADDS (run every 10 minutes)
======================================================= */

setInterval(() => {
    const now = Date.now();
    for (const [key, pending] of pendingAdds.entries()) {
        if (now - pending.timestamp > 10 * 60 * 1000) { // 10 minutes
            pendingAdds.delete(key);
            console.log(`🧹 [GROUPADD] Cleared expired pending add for ${key}`);
        }
    }
}, 10 * 60 * 1000);

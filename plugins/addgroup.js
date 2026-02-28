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
    desc: "Add participant(s) to a group (Owner only)",
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

        // Check if phone numbers are provided
        if (args.length === 0) {
            return reply("❌ Please provide phone number(s).\n\nExample: `.groupadd +94776121326`\nExample: `.groupadd +94776121326, +94774915917`");
        }

        // Parse multiple numbers (split by comma)
        const numbersString = args.join(' ');
        const numberList = numbersString.split(',').map(num => num.trim());
        
        // Process and validate each number
        let phoneNumbers = [];
        let invalidNumbers = [];

        for (const num of numberList) {
            let phoneNumber = num.replace(/[^0-9+]/g, '');
            
            // Ensure number has + prefix
            if (!phoneNumber.startsWith('+')) {
                phoneNumber = '+' + phoneNumber;
            }

            // Basic validation
            if (phoneNumber.length < 10) {
                invalidNumbers.push(num);
            } else {
                phoneNumbers.push(phoneNumber);
            }
        }

        if (phoneNumbers.length === 0) {
            return reply("❌ No valid phone numbers provided. Please include country codes.\nExample: +94776121326");
        }

        if (invalidNumbers.length > 0) {
            reply(`⚠️ *Invalid numbers skipped:* ${invalidNumbers.join(', ')}`);
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
                        id: `addtogroup_${groupJid}_${phoneNumbers.join('|')}`
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
            phoneNumbers: phoneNumbers,
            timestamp: Date.now()
        });

        // Send group selection menu
        await sendInteractiveMessage(sock, from, {
            image: { url: serviceLogo },
            title: "👥 ADD TO GROUP",
            text: `📱 *Numbers to add:*\n${phoneNumbers.map(num => `• ${num}`).join('\n')}\n\n📌 *Select which group to add these participants:*`,
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

        // Parse the selected ID: addtogroup_{groupJid}_{phoneNumbers}
        const parts = selectedId.split('_');
        if (parts.length < 3) return;

        const groupJid = parts[1];
        const phoneNumbersString = parts.slice(2).join('_');
        const phoneNumbers = phoneNumbersString.split('|');

        // Get sender from the message
        const sender = msg.key?.participant || msg.key?.remoteJid || from;

        // Get group name for messages
        const groupMetadata = await conn.groupMetadata(groupJid);
        const groupName = groupMetadata.subject;

        // Send initial processing message
        await conn.sendMessage(from, {
            text: `🔄 *Adding ${phoneNumbers.length} participant(s) to ${groupName}...*\n\nThis may take a few moments.`
        });

        // Track results
        let success = [];
        let failed = [];

        // Add each participant
        for (const phoneNumber of phoneNumbers) {
            try {
                // Clean up phone number
                const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
                const participantJid = cleanNumber.includes('+') 
                    ? cleanNumber.replace('+', '') + '@s.whatsapp.net'
                    : cleanNumber + '@s.whatsapp.net';

                console.log(`📤 [GROUPADD] Adding ${participantJid} to ${groupJid}`);

                // Try to add participant to group
                const response = await conn.groupParticipantsUpdate(
                    groupJid,
                    [participantJid],
                    'add'
                );

                console.log("Group add response:", response);
                success.push(phoneNumber);

                // Small delay between adds to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (err) {
                console.error(`❌ [GROUPADD] Failed to add ${phoneNumber}:`, err.message);
                failed.push({ number: phoneNumber, error: err.message });
            }
        }

        // Prepare result message
        let resultMessage = `📊 *ADD PARTICIPANTS RESULT*\n\n`;
        resultMessage += `👥 *Group:* ${groupName}\n`;
        resultMessage += `━━━━━━━━━━━━━━━━\n\n`;

        if (success.length > 0) {
            resultMessage += `✅ *Successfully added (${success.length}):*\n`;
            success.forEach(num => {
                resultMessage += `• ${num}\n`;
            });
            resultMessage += `\n`;
        }

        if (failed.length > 0) {
            resultMessage += `❌ *Failed to add (${failed.length}):*\n`;
            failed.forEach(item => {
                resultMessage += `• ${item.number}\n`;
                if (item.error.includes('403')) {
                    resultMessage += `  ⚠️ Privacy settings\n`;
                } else if (item.error.includes('already')) {
                    resultMessage += `  ⚠️ Already in group\n`;
                } else {
                    resultMessage += `  ⚠️ ${item.error}\n`;
                }
            });
        }

        // FIX: Send as regular image message instead of interactive message (since no buttons)
        await conn.sendMessage(from, {
            text: resultMessage,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: channelJid,
                    newsletterName: channelName,
                    serverMessageId: -1
                }
            }
        });

        console.log(`✅ [GROUPADD] Completed: ${success.length} success, ${failed.length} failed`);

        // Clear pending add
        pendingAdds.delete(sender);

    } catch (err) {
        console.error("❌ [GROUPADD] Button response error:", err);
        
        await conn.sendMessage(from, {
            text: `❌ *Error processing group add:*\n${err.message}`
        });
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

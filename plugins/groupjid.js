const { cmd } = require('../command');
const { sendInteractiveMessage } = require('gifted-btns');
const config = require('../config');

const groupCache = new Map();

// ------------------ Extract Body (Same Method As Alive Plugin) ------------------
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
           m.msg?.text ||
           m.msg?.conversation ||
           m.msg?.selectedButtonId ||
           m.msg?.singleSelectReply?.selectedRowId ||
           '';
}

// ------------------ MAIN COMMAND ------------------
cmd({
    pattern: "groupjid",
    desc: "Get list of group JIDs",
    category: "owner",
    filename: __filename
}, async (sock, mek, m, { from, reply }) => {

    try {

        // 🔒 Owner Check
        if (!config.OWNER_NUMBER.includes(m.sender.split('@')[0])) {
            return reply("❌ This command is Owner Only.");
        }

        // Get groups
        const groups = await sock.groupFetchAllParticipating();
        const groupList = Object.values(groups);

        if (!groupList.length) {
            return reply("❌ No groups found.");
        }

        // Store in cache using sender
        const sender = m.sender;
        groupCache.set(sender, groups);

        // Build single select rows
        const rows = groupList.map(g => ({
            header: g.subject,
            title: g.subject,
            description: `Members: ${g.participants.length}`,
            id: `selectjid_${g.id}`
        }));

        await sendInteractiveMessage(sock, from, {
            text: "📌 *Select a Group to Get JID*",
            footer: "Owner Only Tool",
            interactiveButtons: [
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "📂 Choose Group",
                        sections: [
                            {
                                title: "Your Groups",
                                rows
                            }
                        ]
                    })
                }
            ]
        }, { quoted: mek });

    } catch (err) {
        console.log(err);
        reply("❌ Error fetching groups.");
    }
});


// ------------------ INTERACTIVE RESPONSE HANDLER ------------------
cmd({
    on: "body"
}, async (sock, mek, m, { from }) => {

    try {

        const body = extractBody(mek, m);

        if (!body.startsWith("selectjid_")) return;

        const groupJid = body.replace("selectjid_", "");
        const sender = m.sender;

        const groups = groupCache.get(sender);
        if (!groups || !groups[groupJid]) return;

        const group = groups[groupJid];

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

    } catch (err) {
        console.log("Interactive handler error:", err);
    }
});

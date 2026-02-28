// plugins/owner_details.js
const { sendButtons } = require('gifted-btns');

const ownerImage = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/mmt-admin.jpeg?raw=true"; // You need to add this image
const ownerNumber = "94722136082"; 
const ownerWhatsAppLink = `https://wa.me/${ownerNumber}`;

module.exports = {
  onMessage: async (conn, mek) => {
    try {
      const key = mek.key;
      const content = mek.message;
      if (!content || key.fromMe) return;

      const text =
        content.conversation ||
        content.extendedTextMessage?.text ||
        content.imageMessage?.caption ||
        "";

      if (!text.toLowerCase().includes("owner details")) return;

      // Send react emoji
      try {
        await conn.sendMessage(key.remoteJid, {
          react: {
            text: "👑",
            key: mek.key,
          }
        });
      } catch (reactError) {}

      // Send image with caption and contact button using gifted-btns
      await sendButtons(conn, key.remoteJid, {
        image: { url: ownerImage },
        title: "👑 *OWNER CONTACT*",
        text: "You can reach out to the bot owner for any inquiries.\n\n⭕ *Name:* M.I.M. IFLAJ\n⭕ *Phone:* +94722136082\n⭕ *Role:*Owner of MMT BUSINESS HUB",
        footer: "Click the button below to chat with owner",
        aimode: false, // Set to false for standard buttons
        buttons: [
          {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
              display_text: '💬 Chat with Owner',
              url: ownerWhatsAppLink
            })
          }
        ]
      }, { quoted: mek });

      console.log("✅ [Owner Plugin] Sent owner info with contact button");
      
    } catch (err) {
      console.error("❌ [Owner Plugin] Error:", err);
      
      // Fallback to original method if buttons fail
      try {
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Bot Owner
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}
END:VCARD`;

        await conn.sendMessage(key.remoteJid, {
          image: { url: ownerImage },
          caption: "👑 *Owner Contact*\n\nYou can reach out to the bot owner for any inquiries.\n⭕ Name: M.I.M. IFLAJ\n⭕ Phone: +94722136082\n*⭕ *Role:*Owner of MMT BUSINESS HUB"
        }, { quoted: mek });

        await conn.sendMessage(key.remoteJid, {
          contacts: { displayName: "Bot Owner", contacts: [{ vcard }] }
        }, { quoted: mek });

        console.log("✅ [Owner Plugin] Sent owner info (fallback method)");
      } catch (fallbackErr) {
        console.error("❌ [Owner Plugin] Fallback also failed:", fallbackErr);
      }
    }
  }
};

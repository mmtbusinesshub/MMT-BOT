const { sendButtons } = require('gifted-btns');

const adminImage = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/admin-girl-image.jpg?raw=true";
const adminNumber = "94771056082"; 
const adminWhatsAppLink = `https://wa.me/${adminNumber}`;

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

      if (!text.toLowerCase().includes("admin details")) return;

        try {
        await conn.sendMessage(key.remoteJid, {
          react: {
            text: "⭕",
            key: mek.key,
          }
        });
      } catch (reactError) {}

      // Send image with caption and contact button using gifted-btns
      await sendButtons(conn, key.remoteJid, {
        image: { url: adminImage },
        title: "🛠️ *ADMIN CONTACT*",
        text: "You can reach out to the admin for support or inquiries.\n\n⭕ *Name:* G.G.Y Ashinsana\n⭕ *Phone:* +94771056082\n⭕ *Role:* Admin of MMT BUSINESS HUB",
        footer: "Click the button below to chat with admin",
        aimode: false, // Set to false for standard buttons
        buttons: [
          {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
              display_text: '💬 Chat with Admin',
              url: adminWhatsAppLink
            })
          }
        ]
      }, { quoted: mek });

      console.log("✅ [Admin Plugin] Sent admin info with contact button");
      
    } catch (err) {
      console.error("❌ [Admin Plugin] Error:", err);
      
      // Fallback to original method if buttons fail
      try {
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Admin
TEL;type=CELL;type=VOICE;waid=${adminNumber}:${adminNumber}
END:VCARD`;

        await conn.sendMessage(key.remoteJid, {
          image: { url: adminImage },
          caption: "🛠️ *Admin Contact*\n\nYou can reach out to the admin for support or inquiries.\n⭕ Name: M.I.M. IFLAJ\n⭕ Phone: +94771056082\n*🤵 Founder of MMT BUSINESS HUB*"
        }, { quoted: mek });

        await conn.sendMessage(key.remoteJid, {
          contacts: { displayName: "Admin", contacts: [{ vcard }] }
        }, { quoted: mek });

        console.log("✅ [Admin Plugin] Sent admin info (fallback method)");
      } catch (fallbackErr) {
        console.error("❌ [Admin Plugin] Fallback also failed:", fallbackErr);
      }
    }
  }
};

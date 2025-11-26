const adminImage = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/WhatsApp%20Image%202025-11-26%20at%205.32.57%20PM.jpeg?raw=true";
const adminNumber = "94722136082"; 

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

      
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Admin
TEL;type=CELL;type=VOICE;waid=${adminNumber}:${adminNumber}
END:VCARD`;

     
      await conn.sendMessage(key.remoteJid, {
        image: { url: adminImage },
        caption: "🛠️ *Admin Contact*\n\nYou can reach out to the admin for support or inquiries.\n⭕ Name: M.I.M. IFLAJ\n⭕ Phone: +94722136082\n*🤵 Founder of MMT BUSINESS HUB*"
      }, { quoted: mek });

        await conn.sendMessage(key.remoteJid, {
        contacts: { displayName: "Admin", contacts: [{ vcard }] }
      }, { quoted: mek });

      console.log("✅ [Admin Plugin] Sent admin info");
    } catch (err) {
      console.error("❌ [Admin Plugin] Error:", err);
    }
  }
};

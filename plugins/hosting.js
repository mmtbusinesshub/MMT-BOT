const hostingImages = [
  "https://github.com/mmtbusinesshub/MMT/blob/main/images/WhatsApp%20Image%202025-11-26%20at%205.40.22%20PM.jpeg?raw=true",
  "https://github.com/mmtbusinesshub/MMT/blob/main/images/WhatsApp%20Image%202025-11-26%20at%205.40.25%20PM.jpeg?raw=true",
  "https://github.com/mmtbusinesshub/MMT/blob/main/images/WhatsApp%20Image%202025-11-26%20at%205.40.26%20PM.jpeg?raw=true"
];

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

      if (!text.toLowerCase().includes("hosting")) return;

      for (let i = 0; i < hostingImages.length; i++) {
        await conn.sendMessage(key.remoteJid, {
          image: { url: hostingImages[i] },
          caption: i === 0 
            ? "🌐 *Hosting Services*\n\nWe offer fast and reliable hosting for your websites and projects.\n\n📞 Contact: wa.me/94722136082"
            : null
        }, { quoted: i === 0 ? mek : undefined });
      }

      console.log("✅ [Hosting Plugin] Sent multiple hosting images");
    } catch (err) {
      console.error("❌ [Hosting Plugin] Error:", err);
    }
  }
};

const { sendInteractiveMessage } = require('gifted-btns');

const channelJid = '120363423526129509@newsletter';
const channelName = 'ミ★ 𝙈𝙈𝙏 𝘽𝙐𝙎𝙄𝙉𝙀𝙎𝙎 𝙃𝙐𝘽 ★彡';
const serviceLogo = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/download.png?raw=true";

const hostingImages = [
  "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/WhatsApp%20Image%202025-11-26%20at%205.40.22%20PM.jpeg?raw=true",
  "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/WhatsApp%20Image%202025-11-26%20at%205.40.25%20PM.jpeg?raw=true",
  "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/WhatsApp%20Image%202025-11-26%20at%205.40.26%20PM.jpeg?raw=true"
];

const hostingKeywords = ['hosting', 'host', 'server', 'website', 'web host'];

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

      if (!text.trim()) return;
      
      const msg = text.toLowerCase();
      const from = key.remoteJid;

      console.log("🌐 [HOSTING PLUGIN] Message received:", msg);

      const isHostingQuery = hostingKeywords.some(keyword => msg.includes(keyword));
      
      if (!isHostingQuery) return;

      try {
        await conn.sendMessage(from, {
          react: {
            text: "🌐",
            key: mek.key,
          }
        });
      } catch (reactError) {}

      // Send all 3 hosting images with contact button
      for (let i = 0; i < hostingImages.length; i++) {
        // Prepare caption text based on image position
        let captionText = "";
        let title = "";
        
        if (i === 0) {
          captionText = "🌐 *HOSTING SERVICES*\n\nWe offer fast and reliable hosting for your websites and projects.";
          title = "🌐 HOSTING SERVICES";
        } else {
          captionText = `📸 *Hosting Preview ${i+1} of ${hostingImages.length}*`;
        }

        await sendInteractiveMessage(conn, from, {
          image: { url: hostingImages[i] },
          title: title,
          text: captionText,  // text is now always provided
          footer: "Need help? Contact support:",
          interactiveButtons: [
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '📞 Contact Support',
                url: 'https://wa.me/94771056082'
              })
            }
          ]
        }, { quoted: i === 0 ? mek : undefined });
      }

      console.log(`✅ [HOSTING PLUGIN] Sent ${hostingImages.length} hosting images with contact button`);

    } catch (err) {
      console.error("❌ [HOSTING PLUGIN] Error:", err);
    }
  }
};

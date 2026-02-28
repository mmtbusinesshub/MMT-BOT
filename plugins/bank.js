const { sendInteractiveMessage } = require('gifted-btns');

const channelJid = '120363423526129509@newsletter'; 
const channelName = 'ミ★ 𝙈𝙈𝙏 𝘽𝙐𝙎𝙄𝙉𝙀𝙎𝙎 𝙃𝙐𝘽 ★彡'; 
const serviceLogo = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/download.png?raw=true";

const bankDetails = {
  'hnb': {
    name: 'HNB BANK TRANSFER',
    shortName: 'HNB',
    details: `*HNB Bank - Nittambuwa Branch*
*Name: M I M IFLAJ*
*Account Number: 250020285400*`,
    emoji: '🏦',
    icon: '🇱🇰'
  },
  'boc': {
    name: 'BOC BANK TRANSFER', 
    shortName: 'BOC',
    details: `*BOC Bank - Nittambuwa Branch*
*Account Number: 0091759510*
*Name: Samsul nisa*`,
    emoji: '🏦',
    icon: '🇱🇰'
  }
};

const bankKeywords = [
  'bank', 'payment', 'transfer', 'deposit', 
  'payment details', 'bank details', 'send money',
  'pay', 'payment method', 'bank account', 'account number'
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
        content.videoMessage?.caption ||
        content.documentMessage?.caption ||
        "";

      if (!text.trim()) return;
      
      const msg = text.toLowerCase();
      const from = key.remoteJid;

      console.log("🏦 [MMT BANK] Message received:", msg);

      const isBankQuery = bankKeywords.some(keyword => msg.includes(keyword));
      
      if (!isBankQuery) return;

      try {
        await conn.sendMessage(from, {
          react: {
            text: "🏦",
            key: mek.key,
          }
        });
      } catch (reactError) {}

      // Send bank selection with buttons
      const buttonText = `🏦 *BANK DETAILS REQUEST*
────────────────────
🇱🇰 *HNB Bank* - Tap button below
🇱🇰 *BOC Bank* - Tap button below
────────────────────
⭕ *Simply tap the button to get complete details.*

⭕ *සම්පූර්න බැන්කු විස්තර ලබාගන්න පහත බටනය ඔබන්න.*

⭕ *முழுமையான வங்கி விவரங்களைப் பெற, கீழே உள்ள பொத்தானைத் தட்டவும்.*`;

      await sendInteractiveMessage(conn, from, {
        image: { url: serviceLogo },
        title: "🏦 BANK DETAILS",
        text: buttonText,
        footer: "Choose your bank:",
        interactiveButtons: [
          {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
              display_text: '🇱🇰 HNB Bank',
              id: 'bank_hnb'
            })
          },
          {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
              display_text: '🇱🇰 BOC Bank',
              id: 'bank_boc'
            })
          },
          {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
              display_text: '📞 Contact Support',
              url: 'https://wa.me/94722136082'
            })
          }
        ]
      }, { quoted: mek });

      console.log(`🏦 [MMT BANK] Sent bank selection buttons`);

    } catch (err) {
      console.error("❌ [MMT BANK] Plugin error:", err);
    }
  },
  
  // Add this new function to handle button responses
  onButtonResponse: async (conn, msg, selectedId, from) => {
    try {
      // Handle bank selection
      if (selectedId === 'bank_hnb') {
        const selectedBank = bankDetails['hnb'];
        const bankMessage = `🏦 *PAYMENT DETAILS*
────────────────────
${selectedBank.icon} *${selectedBank.name}*
────────────────────
${selectedBank.details}
────────────────────
📞 *Support:* wa.me/94722136082`;

        await conn.sendMessage(from, {
          image: { url: serviceLogo },
          caption: bankMessage,
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
        
        console.log(`🏦 [MMT BANK] Sent ${selectedBank.name} details`);
        
      } else if (selectedId === 'bank_boc') {
        const selectedBank = bankDetails['boc'];
        const bankMessage = `🏦 *PAYMENT DETAILS*
────────────────────
${selectedBank.icon} *${selectedBank.name}*
────────────────────
${selectedBank.details}
────────────────────
📞 *Support:* wa.me/94722136082`;

        await conn.sendMessage(from, {
          image: { url: serviceLogo },
          caption: bankMessage,
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
        
        console.log(`🏦 [MMT BANK] Sent ${selectedBank.name} details`);
      }
    } catch (error) {
      console.error("❌ [MMT BANK] Error handling button response:", error);
    }
  }
};

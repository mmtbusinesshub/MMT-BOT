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
  },
  'ezcash': {
    name: 'EZ CASH',
    shortName: 'EZ Cash',
    details: `💵🤑 *eZ Cash*

📱 *Number:* 077 105 6082
⚠️ *Note:* Please add an extra Rs. 20/= for eZ Cash payments.`,
    emoji: '💵',
    icon: '💵'
  }
};

const bankKeywords = [
  'bank', 'payment', 'transfer', 'deposit', 
  'payment details', 'bank details', 'send money',
  'pay', 'payment method', 'bank account', 'account number',
  'ezcash', 'ez cash', 'cash', 'ez'
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
      const buttonText = `🏦 *PAYMENT DETAILS REQUEST*
────────────────────
🇱🇰 *HNB Bank*
🇱🇰 *BOC Bank*
💵 *EZ Cash*
────────────────────
⭕ *Simply tap the button to get complete details.*

⭕ *සම්පූර්න ගෙවීම් විස්තර ලබාගන්න පහත බටනය ඔබන්න.*

⭕ *முழுமையான கட்டண விவரங்களைப் பெற, கீழே உள்ள பொத்தானைத் தட்டவும்.*`;

      await sendInteractiveMessage(conn, from, {
        image: { url: serviceLogo },
        title: "🏦 PAYMENT DETAILS",
        text: buttonText,
        footer: "Choose payment method:",
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
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
              display_text: '💵 EZ Cash',
              id: 'bank_ezcash'
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

      console.log(`🏦 [MMT BANK] Sent payment method selection buttons`);

    } catch (err) {
      console.error("❌ [MMT BANK] Plugin error:", err);
    }
  },
  
  // Handle button responses
  onButtonResponse: async (conn, msg, selectedId, from) => {
    try {
      // Handle payment method selection
      if (selectedId === 'bank_hnb') {
        const selectedBank = bankDetails['hnb'];
        const bankMessage = `🏦 *PAYMENT DETAILS*
────────────────────
${selectedBank.icon} *${selectedBank.name}*
────────────────────
${selectedBank.details}
────────────────────
⏱️ *Please send payment screenshot after transfer*`;

        // Send with contact support button
        await sendInteractiveMessage(conn, from, {
          image: { url: serviceLogo },
          title: "🏦 PAYMENT DETAILS",
          text: bankMessage,
          footer: "Need help? Contact support:",
          interactiveButtons: [
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '📞 Contact Support',
                url: 'https://wa.me/94722136082'
              })
            }
          ]
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
⏱️ *Please send payment screenshot after transfer*`;

        // Send with contact support button
        await sendInteractiveMessage(conn, from, {
          image: { url: serviceLogo },
          title: "🏦 PAYMENT DETAILS",
          text: bankMessage,
          footer: "Need help? Contact support:",
          interactiveButtons: [
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '📞 Contact Support',
                url: 'https://wa.me/94722136082'
              })
            }
          ]
        });
        
        console.log(`🏦 [MMT BANK] Sent ${selectedBank.name} details`);
        
      } else if (selectedId === 'bank_ezcash') {
        const selectedBank = bankDetails['ezcash'];
        const bankMessage = `💵 *EZ CASH PAYMENT*
────────────────────
${selectedBank.details}
────────────────────
⏱️ *Please send payment screenshot after transfer*`;

        // Send with contact support button
        await sendInteractiveMessage(conn, from, {
          image: { url: serviceLogo },
          title: "💵 EZ CASH DETAILS",
          text: bankMessage,
          footer: "Need help? Contact support:",
          interactiveButtons: [
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '📞 Contact Support',
                url: 'https://wa.me/94722136082'
              })
            }
          ]
        });
        
        console.log(`🏦 [MMT BANK] Sent EZ Cash details`);
      }
    } catch (error) {
      console.error("❌ [MMT BANK] Error handling button response:", error);
    }
  }
};

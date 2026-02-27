const { sendInteractiveMessage } = require('gifted-btns');

const channelJid = '120363423526129509@newsletter'; 
const channelName = 'ミ★ 𝙈𝙈𝙏 𝘽𝙐𝙎𝙄𝙉𝙀𝙎𝙎 𝙃𝙐𝘽 ★彡'; 
const serviceLogo = "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/download.png?raw=true";

const bankDetails = {
  hnb: {
    name: 'HNB BANK TRANSFER',
    details: `*HNB Bank - Nittambuwa Branch*
*Name: M I M IFLAJ*
*Account Number: 250020285400*`,
    icon: '🇱🇰'
  },
  boc: {
    name: 'BOC BANK TRANSFER',
    details: `*BOC Bank - Nittambuwa Branch*
*Account Number: 0091759510*
*Name: Samsul nisa*`,
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

      const from = key.remoteJid;

      // =============================
      // 🔥 EXTRACT TEXT OR BUTTON ID
      // =============================

      let text =
        content.conversation ||
        content.extendedTextMessage?.text ||
        content.imageMessage?.caption ||
        content.videoMessage?.caption ||
        content.documentMessage?.caption ||
        "";

      let selectedId = '';

      // Handle normal button
      if (content.buttonsResponseMessage) {
        selectedId = content.buttonsResponseMessage.selectedButtonId;
      }

      // Handle interactive flow button
      if (content.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
        try {
          const parsed = JSON.parse(
            content.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson
          );
          selectedId = parsed.id || '';
        } catch {}
      }

      const msg = text.toLowerCase();

      // =============================
      // 🎯 HANDLE BUTTON SELECTION
      // =============================

      if (selectedId === 'bank_hnb' || selectedId === 'bank_boc') {

        const keyName = selectedId.replace('bank_', '');
        const selectedBank = bankDetails[keyName];

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
        }, { quoted: mek });

        console.log(`🏦 Sent ${selectedBank.name} details`);
        return;
      }

      // =============================
      // 🏦 HANDLE BANK KEYWORD REQUEST
      // =============================

      const isBankQuery = bankKeywords.some(keyword => msg.includes(keyword));
      if (!isBankQuery) return;

      try {
        await conn.sendMessage(from, {
          react: { text: "🏦", key: mek.key }
        });
      } catch {}

      const buttonText = `🏦 *BANK DETAILS REQUEST*
────────────────────
🇱🇰 *HNB Bank*
🇱🇰 *BOC Bank*
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

      console.log("🏦 Sent bank selection buttons");

    } catch (err) {
      console.error("❌ [MMT BANK] Plugin error:", err);
    }
  }
};

module.exports.bankDetails = bankDetails;
module.exports.channelJid = channelJid;
module.exports.channelName = channelName;
module.exports.serviceLogo = serviceLogo;

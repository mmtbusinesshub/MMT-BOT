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
  'bank','payment','transfer','deposit',
  'payment details','bank details','send money',
  'pay','payment method','bank account','account number'
];

module.exports = {
  onMessage: async (conn, mek) => {
    try {
      if (!mek.message || mek.key.fromMe) return;

      const from = mek.key.remoteJid;

      // 🔥 ALWAYS unwrap ephemeral FIRST
      mek.message = mek.message?.ephemeralMessage?.message || mek.message;

      const message = mek.message;

      // =============================
      // 🔘 HANDLE BUTTON RESPONSE
      // =============================

      let selectedId = '';

      if (message.buttonsResponseMessage) {
        selectedId = message.buttonsResponseMessage.selectedButtonId;
      }

      if (message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
        try {
          const parsed = JSON.parse(
            message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson
          );
          selectedId = parsed.id || '';
        } catch {}
      }

      if (selectedId && selectedId.startsWith('bank_')) {

        const key = selectedId.replace('bank_', '');
        const selectedBank = bankDetails[key];
        if (!selectedBank) return;

        await conn.sendMessage(from, {
          image: { url: serviceLogo },
          caption: `🏦 *PAYMENT DETAILS*
────────────────────
${selectedBank.icon} *${selectedBank.name}*
────────────────────
${selectedBank.details}
────────────────────
📞 *Support:* wa.me/94722136082`,
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

        return; // STOP after handling
      }

      // =============================
      // 🏦 HANDLE KEYWORD REQUEST
      // =============================

      const text =
        message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        "";

      if (!text) return;

      const msg = text.toLowerCase();
      const isBankQuery = bankKeywords.some(k => msg.includes(k));
      if (!isBankQuery) return;

await sendInteractiveMessage(conn, from, {
  image: { url: serviceLogo },
  title: "🏦 BANK DETAILS",
  text: `🏦 *BANK DETAILS REQUEST*

⭕ Tap button to get full details`,
  footer: "Choose your bank:",
  aimode: true, // 🔥 ADD THIS
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
    }
  ]
}, { quoted: mek });

    } catch (err) {
      console.log("❌ Bank Plugin Error:", err);
    }
  }
};

module.exports.bankDetails = bankDetails;
module.exports.channelJid = channelJid;
module.exports.channelName = channelName;
module.exports.serviceLogo = serviceLogo;

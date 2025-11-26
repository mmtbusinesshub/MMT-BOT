const fs = require("fs");
const path = require("path");
const config = require("../config");
const { cmd } = require("../command");
const { sleep } = require("../lib/functions");

cmd({
  pattern: "bulk",
  alias: ["crm"],
  react: "📢",
  desc: "Send bulk messages to all contacts from CSV files safely",
  category: "owner",
  filename: __filename
}, async (conn, mek, m, { reply, sender }) => {
  try {
    const ownerJid = config.BOT_OWNER + "@s.whatsapp.net";
    if (sender !== ownerJid)
      return reply("❌ Only the bot owner can use this command.");

    if (!m.message)
      return reply("📢 Please send a message (text, image, video, audio, document, or sticker) you want to bulk\n\n`Ex: .bulk Hello everyone!`");

    let captionText = "";
    let mediaType = null;
    let mediaBuffer = null;

    if (m.message.imageMessage) {
      mediaType = "image";
      captionText = m.message.imageMessage.caption || "";
      mediaBuffer = await m.download();
    } else if (m.message.videoMessage) {
      mediaType = "video";
      captionText = m.message.videoMessage.caption || "";
      mediaBuffer = await m.download();
    } else if (m.message.audioMessage) {
      mediaType = "audio";
      mediaBuffer = await m.download();
    } else if (m.message.documentMessage) {
      mediaType = "document";
      captionText = m.message.documentMessage.caption || "";
      mediaBuffer = await m.download();
    } else if (m.message.stickerMessage) {
      mediaType = "sticker";
      mediaBuffer = await m.download();
    } else if (m.message.extendedTextMessage) {
      mediaType = "text";
      captionText = m.message.extendedTextMessage.text || "";
    } else if (m.message.conversation) {
      mediaType = "text";
      captionText = m.message.conversation || "";
    }

    captionText = captionText.replace(/^(\.bulk|\.crm)\s*/i, "").trim();
    if (!mediaBuffer && !captionText) return reply("❌ Please provide a valid message to bulk.");

    const dataFolder = path.join(__dirname, "../data");
    const files = fs.readdirSync(dataFolder).filter(f => f.endsWith(".csv"));

    if (!files.length) return reply("❌ No CSV files found in /data folder.");

    let contacts = [];

    for (const file of files) {
      const csvData = fs.readFileSync(path.join(dataFolder, file), "utf8").trim();
      const rows = csvData.split("\n").slice(1); 

      for (const row of rows) {
        if (!row.trim()) continue;
        const columns = row.split(',').map(col => col.trim());
        if (columns.length >= 2) {
          let number = columns[0];

          if (number.includes('@')) number = number.split('@')[0];

          if (number && /^\d{10,15}$/.test(number)) contacts.push(number);
        }
      }
    }

    const uniqueContacts = [...new Set(contacts)];
    if (!uniqueContacts.length) return reply("⚠️ No valid contacts found in CSV files.");

    await reply(`*📢 Sending bulk messages to ${uniqueContacts.length} contacts in batches...*`);

    const batchSize = 50;
    const delayBetweenContacts = 2000;
    const delayBetweenBatches = 15000; 

    let success = 0, fail = 0;

    for (let i = 0; i < uniqueContacts.length; i += batchSize) {
      const batch = uniqueContacts.slice(i, i + batchSize);

      for (const number of batch) {
        const jid = number + "@s.whatsapp.net";
        try {
          let messageOptions = {};

          if (mediaType === "image" && mediaBuffer) messageOptions = { image: mediaBuffer, caption: captionText };
          else if (mediaType === "video" && mediaBuffer) messageOptions = { video: mediaBuffer, caption: captionText };
          else if (mediaType === "audio" && mediaBuffer) messageOptions = { audio: mediaBuffer, mimetype: 'audio/mp4' };
          else if (mediaType === "document" && mediaBuffer) messageOptions = { document: mediaBuffer, caption: captionText, fileName: m.message.documentMessage?.fileName || 'document' };
          else if (mediaType === "sticker" && mediaBuffer) messageOptions = { sticker: mediaBuffer };
          else if (captionText) messageOptions = { text: captionText };
          else { fail++; continue; }

          await conn.sendMessage(jid, messageOptions);
          console.log(`✅ Sent to ${number}`);
          success++;
          await sleep(delayBetweenContacts);

        } catch (err) {
          console.error(`❌ Failed to send to ${number}:`, err.message);
          fail++;
          await sleep(delayBetweenContacts + 1000);
        }
      }

      console.log(`⏳ Batch completed. Waiting ${delayBetweenBatches / 1000}s before next batch...`);
      await sleep(delayBetweenBatches);
    }

    await reply(`*📢 Broadcast completed!*\n✅ Success: ${success}\n❌ Failed: ${fail}\n📞 Total: ${uniqueContacts.length}`);

  } catch (err) {
    console.error("Broadcast error:", err);
    reply("❌ Broadcast failed:\n" + err.message);
  }
});

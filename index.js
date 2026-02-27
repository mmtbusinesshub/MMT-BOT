const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const config = require('./config');
const { ownerNumber } = require('./config');
const { BOT_OWNER } = require('./config');
const util = require('util');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const { sms } = require('./lib/msg');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions');
const { File } = require('megajs');
const express = require("express");

const app = express();
const port = process.env.PORT || 8000;

const prefix = '.';

// API Configuration
const API_KEY = config.MMT_API_KEY || 'b5b896b46d9b35e218d0ee1b4d11e070';
const API_URL = 'https://makemetrend.online/api/v2';

let serviceCache = {
  data: null,
  lastFetch: 0,
  lastReset: Date.now()
};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function fetchServicesFromAPI() {
  const maxRetries = 10;
  const retryDelay = 5000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 [MMT BUSINESS HUB] Fetching services from API (Attempt ${attempt}/${maxRetries})...`);

      // Fix: Use URLSearchParams instead of JSON
      const params = new URLSearchParams();
      params.append('key', API_KEY);
      params.append('action', 'services');

      const response = await axios.post(API_URL, params, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Check if response has success false
      if (response.data && response.data.success === false) {
        throw new Error(`API Error: ${response.data.error || 'Unknown error'}`);
      }

      if (response.status === 200 && Array.isArray(response.data)) {
        // Transform API response to match the existing format
        const services = response.data.map(service => ({
          category: service.category || 'Uncategorized',
          name: service.name,
          price: service.rate,
          min: service.min,
          max: service.max,
          service_id: service.service,
          type: service.type,
          link: 'https://makemetrend.online/services'
        }));

        if (services.length > 0) {
          serviceCache.data = services;
          serviceCache.lastFetch = Date.now();
          console.log(`✅ [MMT BUSINESS HUB] Successfully cached ${services.length} services from API`);
          return services;
        } else {
          throw new Error("No services returned from API");
        }
      } else {
        throw new Error(`Invalid API response: ${JSON.stringify(response.data)}`);
      }

    } catch (error) {
      console.error(`❌ [MMT BUSINESS HUB] API Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (error.response) {
        console.error('API Error Details:', {
          status: error.response.status,
          data: error.response.data
        });
      }

      if (attempt === maxRetries) {
        throw new Error(`All ${maxRetries} API attempts failed. Cannot start bot without services data.`);
      }

      if (attempt < maxRetries) {
        console.log(`⏳ [MMT BUSINESS HUB] Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}

function resetServiceCache() {
  serviceCache.data = null;
  serviceCache.lastFetch = 0;
  serviceCache.lastReset = Date.now();
  console.log("🔄 [MMT BUSINESS HUB] Service cache reset");
}

async function getServices() {
  const now = Date.now();

  // Check if cache duration exceeded (24 hours)
  if (now - serviceCache.lastReset >= CACHE_DURATION) {
    console.log("🔄 [MMT BUSINESS HUB] Auto-resetting 24-hour cache...");
    resetServiceCache();
  }

  // Fetch new data if cache is empty or older than 1 hour
  if (!serviceCache.data || now - serviceCache.lastFetch >= 60 * 60 * 1000) {
    return await fetchServicesFromAPI();
  }

  return serviceCache.data || [];
}

// Optional: Function to fetch specific service details
async function getServiceById(serviceId) {
  try {
    const services = await getServices();
    return services.find(service => service.service_id == serviceId) || null;
  } catch (error) {
    console.error('Error fetching service by ID:', error);
    return null;
  }
}

// Optional: Function to fetch services by category
async function getServicesByCategory(category) {
  try {
    const services = await getServices();
    return services.filter(service => 
      service.category.toLowerCase().includes(category.toLowerCase())
    );
  } catch (error) {
    console.error('Error fetching services by category:', error);
    return [];
  }
}

global.mmtServices = {
  getServices,
  resetServiceCache,
  fetchServicesFromAPI,
  getServiceById,
  getServicesByCategory
};

if (!fs.existsSync(__dirname + '/auth_info_baileys/creds.json')) {
  if (!config.SESSION_ID) {
    console.log('❗ [MMT BUSINESS HUB] SESSION_ID not found in env. Please configure it.');
  } else {
    const sessdata = config.SESSION_ID;
    const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
    filer.download((err, data) => {
      if (err) throw err;
      fs.writeFile(__dirname + '/auth_info_baileys/creds.json', data, () => {
        console.log("📥 [MMT BUSINESS HUB] Session file downloaded and saved.");
      });
    });
  }
}

const { replyHandlers, commands } = require('./command');
global.pluginHooks = global.pluginHooks || [];
const autoGreetingsPlugin = require('./plugins/ai.js');
global.pluginHooks.push(autoGreetingsPlugin);
const bankDetailsPlugin = require('./plugins/bank.js');
global.pluginHooks.push(bankDetailsPlugin);
const hostingPlugin = require('./plugins/hosting.js');
global.pluginHooks.push(hostingPlugin);
const adminDetails = require('./plugins/admin_details.js');
global.pluginHooks.push(adminDetails);

async function connectToWA() {
  console.log("🛰️ [MMT BUSINESS HUB] Initializing WhatsApp connection...");

  try {
    console.log("📥 [MMT BUSINESS HUB] Pre-loading services cache from API (required for bot startup)...");
    const services = await fetchServicesFromAPI();

    if (services && services.length > 0) {
      console.log(`✅ [MMT BUSINESS HUB] Services pre-loaded successfully: ${services.length} items`);
      console.log('📊 Sample service:', services[0]); // Log first service as sample
    } else {
      throw new Error("No services loaded from API");
    }

  } catch (error) {
    console.error(`🚫 [MMT BUSINESS HUB] CRITICAL: ${error.message}`);
    console.log("💤 [MMT BUSINESS HUB] Bot startup cancelled. Services are required for operation.");
    process.exit(1);
  }

  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys/');
  const { version } = await fetchLatestBaileysVersion();

  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: true,
    auth: state,
    version
  });

  conn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
      connectToWA();
    } else if (connection === 'open') {
      console.log("🔧 [MMT BUSINESS HUB] Installing plugins...");
      const path = require('path');
      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".js") {
          require("./plugins/" + plugin);
        }
      });
      console.log("✅ [MMT BUSINESS HUB] Plugins installed successfully.");
      console.log("📶 [MMT BUSINESS HUB] Successfully connected to WhatsApp!");

      const up = `╭━〔 🚀 *MMT BUSINESS HUB* 🚀
┃━━━━━━━━━━━━━━━━━━━━                                           
┃ ✅ *Connection Status* : ONLINE        
┃ 👑 *Auto-Reply System* : ACTIVATED     
┃ 📡 *Business Account* : MMT BUSINESS HUB
┃ 💠 *Powered By* : WhatsApp Business API
┃ 📊 *Services Cached* : ${serviceCache.data ? serviceCache.data.length : 0} items
┃ 🔌 *Data Source* : Official API
┃ 🌐 *Group Support* : ENABLED
┃                                           
╰━━━━━━━━━━━━━━━━━━━━╯

🌟 *Social Media Marketing Assistant Ready!*  

💼 *Use .ping to test if bot is alive or not*
🔹 *Use .bank for bank details*
🔹 *Use .services to see all available services*
🔹 *Use .order to place an order*

🎯 *Growing Your Business, One Click at a Time!*
╰━━━━━━━━━━━━━━━━━━━━╯
`;
      conn.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
        image: { url: config.ALIVE_IMG },
        caption: up
      });
    }
  });

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('messages.upsert', async (mek) => {
    mek = mek.messages[0];
    if (!mek.message) return;

    const contentType = getContentType(mek.message);
    const content = mek.message[contentType];

    if (['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(contentType)) {
      try {
        const stream = await downloadContentFromMessage(content, contentType.replace('Message', ''));
        const buffer = [];
        for await (const chunk of stream) buffer.push(chunk);
        mek._mediaBuffer = Buffer.concat(buffer);
        mek._mediaType = contentType;
      } catch (err) {
        console.log('❌ [MMT BUSINESS HUB] Failed to pre-download media:', err.message);
      }
    }

    // Get message details
    const from = mek.key.remoteJid;
    const isGroup = from && from.endsWith('@g.us');

    mek.message = (getContentType(mek.message) === 'ephemeralMessage')
      ? mek.message.ephemeralMessage.message
      : mek.message;

    if (config.READ_MESSAGE === 'true') {
      await conn.readMessages([mek.key]);
      console.log(`[MMT BUSINESS HUB] Marked message from ${mek.key.remoteJid} as read.`);
    }

    if (mek.key?.remoteJid === 'status@broadcast') {
      const senderJid = mek.key.participant || mek.key.remoteJid || "unknown@s.whatsapp.net";
      const mentionJid = senderJid.includes("@s.whatsapp.net") ? senderJid : senderJid + "@s.whatsapp.net";

      if (config.AUTO_STATUS_SEEN === "true") {
        try {
          await conn.readMessages([mek.key]);
          console.log(`[MMT BUSINESS HUB] Status seen: ${mek.key.id}`);
        } catch (e) {
          console.error("❌ [MMT BUSINESS HUB] Failed to mark status as seen:", e);
        }
      }

      if (config.AUTO_STATUS_REACT === "true" && mek.key.participant) {
        try {
          const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '💜', '💙', '🌝', '🖤', '💚'];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

          await conn.sendMessage(mek.key.participant, {
            react: {
              text: randomEmoji,
              key: mek.key,
            }
          });

          console.log(`[MMT BUSINESS HUB] Reacted to status of ${mek.key.participant} with ${randomEmoji}`);
        } catch (e) {
          console.error("❌ [MMT BUSINESS HUB] Failed to react to status:", e);
        }
      }
    }

    const m = sms(conn, mek);
    const type = getContentType(mek.message);
  const body =
    (type === 'conversation') ? mek.message.conversation :
    (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text :
    (type === 'templateButtonReplyMessage') ? mek.message.templateButtonReplyMessage?.selectedId :
    (type === 'interactiveResponseMessage') ? (() => {
      try {
        const json = JSON.parse(
          mek.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
        );
        return json?.id || '';
      } catch {
        return '';
      }
    })() :
    (type === 'imageMessage') ? mek.message.imageMessage?.caption :
    (type === 'videoMessage') ? mek.message.videoMessage?.caption :
    m.msg?.text ||
    m.msg?.conversation ||
    m.msg?.caption ||
    m.msg?.selectedButtonId ||
    m.msg?.singleSelectReply?.selectedRowId ||
    '';
    const isCmd = body.startsWith(prefix);
    const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(' ');

    const sender = mek.key.fromMe
      ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id)
      : (mek.key.participant || mek.key.remoteJid);

    const senderNumber = sender.split('@')[0];
    const botNumber = conn.user.id.split(':')[0];
    const pushname = mek.pushName || 'Sin Nombre';
    const isMe = botNumber.includes(senderNumber);
    const isOwner = ownerNumber.includes(senderNumber) || isMe;

    const currentMode = (config.MODE || 'public').toLowerCase();

if (currentMode === 'private') {
  // PRIVATE MODE: Only owner can use bot (both inbox and groups)
  if (!isOwner) {
    console.log(`🔒 [PRIVATE MODE] Ignoring message from non-owner ${senderNumber} in ${isGroup ? 'group' : 'inbox'}`);
    return; // Block all non-owner messages
  }
} 
else if (currentMode === 'inbox') {
  // INBOX MODE: All users can use in inbox, but block ALL group messages
  if (isGroup) {
    console.log(`📱 [INBOX MODE] Ignoring group message from ${senderNumber} in ${from}`);
    return; // Block all group messages
  }
  // Inbox messages from all users are allowed (no need to check isOwner)
}
// PUBLIC MODE: Everything allowed (no checks needed)

// Process plugins for messages
if (global.pluginHooks) {
  for (const plugin of global.pluginHooks) {
    if (plugin.onMessage) {
      try {
        await plugin.onMessage(conn, mek);
      } catch (e) {
        console.log("[MMT BUSINESS HUB] onMessage error:", e);
      }
    }
  }
}
    const botNumber2 = await jidNormalizedUser(conn.user.id);

    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => ({})) : {};
    const groupName = groupMetadata?.subject || 'No Group Name';
    const participants = groupMetadata.participants || [];

    const groupAdminsRaw = isGroup ? getGroupAdmins(participants) : [];
    const groupAdmins = groupAdminsRaw.map(jidNormalizedUser);

    const senderId = jidNormalizedUser(sender);
    const botId = jidNormalizedUser(conn.user.id);

    const isAdmins = groupAdmins.includes(senderId);
    const isBotAdmins = groupAdmins.includes(botId);

    const reply = (text, options = {}) => conn.sendMessage(from, { text, ...options }, { quoted: mek });

    conn.decodeJid = jid => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return (
          (decode.user &&
            decode.server &&
            decode.user + '@' + decode.server) ||
          jid
        );
      } else return jid;
    };

    if (isCmd) {
      const cmd = commands.find((c) => c.pattern === commandName || (c.alias && c.alias.includes(commandName)));
      if (cmd) {
        switch ((config.MODE || 'public').toLowerCase()) {
          case 'private':
            if (!isOwner) return;
            break;
          case 'public':
          default:
            break;
        }

        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });

        try {
          cmd.function(conn, mek, m, {
            from, quoted: mek, body, isCmd, command: commandName, args, q,
            isGroup, sender, senderNumber, botNumber2, botNumber, pushname,
            isMe, isOwner, groupMetadata, groupName, participants, groupAdmins,
            isBotAdmins, isAdmins, reply,
          });
        } catch (e) {
          console.error("[MMT BUSINESS HUB] PLUGIN ERROR: " + e);
        }
      }
    }

    const replyText = body;
    for (const handler of replyHandlers) {
      if (handler.filter(replyText, { sender, message: mek })) {
        try {
          await handler.function(conn, mek, m, {
            from, quoted: mek, body: replyText, sender, reply,
          });
          break;
        } catch (e) {
          console.log("[MMT BUSINESS HUB] Reply handler error:", e);
        }
      }
    }
  });

  conn.ev.on('messages.update', async (updates) => {
    // Process delete events for all chats (including groups)
    if (global.pluginHooks) {
      for (const plugin of global.pluginHooks) {
        if (plugin.onDelete) {
          try {
            await plugin.onDelete(conn, updates);
          } catch (e) {
            console.log("[MMT BUSINESS HUB] onDelete error:", e);
          }
        }
      }
    }
  });
} // end connectToWA

app.get("/", (req, res) => {
  res.send("MMT BUSINESS HUB Auto-Reply System Started ✅");
});

app.listen(port, () => console.log(`🌐 [MMT BUSINESS HUB] Web server running → http://localhost:${port}`));

setTimeout(() => {
  connectToWA();
}, 4000);

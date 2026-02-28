const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

const defaultConfig = {
  SESSION_ID: "lBlXwbqL#FeOUMkWCio1sARvLPrE1rPun0Xf4JQcUgHsSfCqVn3Y", // Put your session id here
  ALIVE_IMG: "https://github.com/mmtbusinesshub/MMT-BOT/blob/main/images/download.png?raw=true",
  ALIVE_MSG: "",
  BOT_OWNER: "94716252841", // Replace your bot owner number here with 94(country code)
  ownerNumber: ["94716252841"], // Replace your bot owner number here (same as bot owner number)
  AUTO_STATUS_REACT: "true",
  AUTO_STATUS_REPLY: "true",
  AUTO_STATUS_SEEN: "true",
  MODE: "inbox", // 'private', 'public'
  MMT_API_KEY: "529e5c3a2253bf93a5d9c2e104a3b498",
  ALLOWED_GROUPS: ["120363407450693131@g.us"], // Add your allowed group JIDs here
};

//*******************************************************************************************************************************************************

module.exports = {
  AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || defaultConfig.AUTO_STATUS_REACT,
  AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || defaultConfig.AUTO_STATUS_REPLY,
  AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || defaultConfig.AUTO_STATUS_SEEN,
  MMT_API_KEY: process.env.MMT_API_KEY || defaultConfig.MMT_API_KEY,
  SESSION_ID: process.env.SESSION_ID || defaultConfig.SESSION_ID,
  ALIVE_IMG: process.env.ALIVE_IMG || defaultConfig.ALIVE_IMG,
  ALIVE_MSG: process.env.ALIVE_MSG || defaultConfig.ALIVE_MSG,
  BOT_OWNER: process.env.BOT_OWNER || defaultConfig.BOT_OWNER,
  ownerNumber: process.env.ownerNumber
    ? process.env.ownerNumber.split(",")
    : defaultConfig.ownerNumber,
  ALLOWED_GROUPS: process.env.ALLOWED_GROUPS
    ? process.env.ALLOWED_GROUPS.split(",")
    : defaultConfig.ALLOWED_GROUPS,
  AUTO_READ_STATUS: convertToBool(process.env.AUTO_READ_STATUS, defaultConfig.AUTO_READ_STATUS),
  MODE: process.env.MODE || defaultConfig.MODE,
};

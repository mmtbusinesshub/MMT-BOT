// plugins/system.js
const { cmd, commands } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "system",
    desc: "View and update system configuration (Owner only)",
    category: "owner",
    filename: __filename
},
async (danuwamd, mek, m, {
    from, quoted, body, isCmd, command, args, q, isGroup,
    sender, senderNumber, botNumber2, botNumber, pushname,
    isMe, isOwner, groupMetadata, groupName, participants,
    groupAdmins, isBotAdmins, isAdmins, reply
}) => {
    try {
        // Check if user is owner
        if (!isOwner) {
            return reply("❌ *This command is only for bot owners!*");
        }

        // If no arguments, show current config
        if (!args.length) {
            let configStatus = `╭━━〔 ⚙️ SYSTEM CONTROL PANEL 〕━━╮
┃
┃ 📌 *Mode Control*
┃   • .system mode public
┃   • .system mode private
┃   • .system mode inbox
┃
┃ 🟢 *Alive Settings*
┃   • .system aliveimg <image_url>
┃   • .system alivemsg <message>
┃
┃ 👑 *Owner Management*
┃   • .system botowner <number>
┃   • .system addowner <number>
┃   • .system removeowner <number>
┃
┃ 🔄 *Auto Status Controls*
┃   • .system autoseen true|false
┃   • .system autoreact true|false
┃   • .system autoreply true|false
┃
┃ 🔑 *API Configuration*
┃   • .system apikey <new_key>
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;

            return reply(configStatus);
        }

        const command = args[0].toLowerCase();
        const value = args.slice(1).join(' ');

        // Handle different configuration commands
        switch (command) {
            case 'mode':
                if (!['public', 'private', 'inbox'].includes(value)) {
                    return reply("❌ *Mode must be: public, private, or inbox*");
                }
                config.MODE = value;
                updateEnvFile('MODE', value);
                reply(`✅ *Mode updated to:* ${value}`);
                break;

            case 'aliveimg':
                if (!value.startsWith('http')) {
                    return reply("❌ *Please provide a valid image URL*");
                }
                config.ALIVE_IMG = value;
                updateEnvFile('ALIVE_IMG', value);
                reply(`✅ *Alive image updated successfully!*`);
                break;

            case 'alivemsg':
                config.ALIVE_MSG = value;
                updateEnvFile('ALIVE_MSG', value);
                reply(`✅ *Alive message updated to:*\n${value}`);
                break;

            case 'botowner':
                if (!value.match(/^\d+$/)) {
                    return reply("❌ *Please provide a valid phone number*");
                }
                config.BOT_OWNER = value;
                config.ownerNumber = [value];
                updateEnvFile('BOT_OWNER', value);
                updateEnvFile('ownerNumber', value);
                reply(`✅ *Bot owner updated to:* ${value}`);
                break;

            case 'addowner':
                if (!value.match(/^\d+$/)) {
                    return reply("❌ *Please provide a valid phone number*");
                }
                if (!config.ownerNumber.includes(value)) {
                    config.ownerNumber.push(value);
                    updateEnvFile('ownerNumber', config.ownerNumber.join(','));
                    reply(`✅ *Added owner:* ${value}\n👥 *Current owners:* ${config.ownerNumber.join(', ')}`);
                } else {
                    reply(`❌ *${value} is already an owner*`);
                }
                break;

            case 'removeowner':
                if (!value.match(/^\d+$/)) {
                    return reply("❌ *Please provide a valid phone number*");
                }
                const index = config.ownerNumber.indexOf(value);
                if (index > -1) {
                    config.ownerNumber.splice(index, 1);
                    updateEnvFile('ownerNumber', config.ownerNumber.join(','));
                    reply(`✅ *Removed owner:* ${value}\n👥 *Current owners:* ${config.ownerNumber.join(', ')}`);
                } else {
                    reply(`❌ *${value} is not in owners list*`);
                }
                break;

            case 'autoreact':
                if (!['true', 'false'].includes(value)) {
                    return reply("❌ *Value must be true or false*");
                }
                config.AUTO_STATUS_REACT = value;
                updateEnvFile('AUTO_STATUS_REACT', value);
                reply(`✅ *Auto status react set to:* ${value}`);
                break;

            case 'autoreply':
                if (!['true', 'false'].includes(value)) {
                    return reply("❌ *Value must be true or false*");
                }
                config.AUTO_STATUS_REPLY = value;
                updateEnvFile('AUTO_STATUS_REPLY', value);
                reply(`✅ *Auto status reply set to:* ${value}`);
                break;

            case 'autoseen':
                if (!['true', 'false'].includes(value)) {
                    return reply("❌ *Value must be true or false*");
                }
                config.AUTO_STATUS_SEEN = value;
                updateEnvFile('AUTO_STATUS_SEEN', value);
                reply(`✅ *Auto status seen set to:* ${value}`);
                break;

            case 'apikey':
                if (!value) {
                    return reply("❌ *Please provide an API key*");
                }
                config.MMT_API_KEY = value;
                updateEnvFile('MMT_API_KEY', value);
                reply(`✅ *API Key updated successfully!*`);
                break;

            default:
                reply(`❌ *Unknown command: ${command}*\nUse .system to see available commands`);
        }

    } catch (e) {
        console.log(e);
        reply(`❌ *Error:* ${e.message}`);
    }
});

// Helper function to update .env file
function updateEnvFile(key, value) {
    try {
        const envPath = path.join(__dirname, '../config.env');
        let envContent = '';

        // Read existing .env file if it exists
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Create or update the key-value pair
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (envContent.match(regex)) {
            // Key exists, replace it
            envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
            // Key doesn't exist, append it
            envContent += `\n${key}=${value}`;
        }

        // Write back to file
        fs.writeFileSync(envPath, envContent.trim());
        console.log(`📝 [SYSTEM] Updated ${key} in config.env`);

        // Also update config.js if needed (but changes will persist in .env)
        const configPath = path.join(__dirname, '../config.js');
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        // Update defaultConfig in config.js for the specific key
        const defaultRegex = new RegExp(`(${key}:\\s*")[^"]*(",)`, 'g');
        if (configContent.match(defaultRegex)) {
            configContent = configContent.replace(defaultRegex, `$1${value}$2`);
            fs.writeFileSync(configPath, configContent);
        }

    } catch (err) {
        console.error('❌ [SYSTEM] Error updating env file:', err);
    }
}

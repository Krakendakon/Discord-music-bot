const { Client, Intents } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');  // Import fs module
const path = require('path');  // Import path module
const { token } = require('./config.json');  // Load token from config.json

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,  // To manage guilds (servers)
        Intents.FLAGS.GUILD_VOICE_STATES,  // To manage voice states (i.e., join voice channels)
        Intents.FLAGS.GUILD_MESSAGES  // To read messages (for commands)
    ]
});

// Global song queue map for each guild
const songQueue = new Map();

client.commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', file));  // Correct the require path here
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log('Bot is online!');
});

// Register commands when the bot joins a new guild
client.on('guildCreate', async guild => {
    // Convert the Map to an array of commands
    const commands = Array.from(client.commands.values()).map(command => command.data.toJSON());

    try {
        // Register commands for this specific guild
        await guild.commands.set(commands);
        console.log(`Commands registered for new guild: ${guild.name}`);
    } catch (error) {
        console.error(`Error registering commands for guild: ${guild.name}`, error);
    }
});

// Interaction handling (for slash commands)
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        // Pass the songQueue map to the execute function of each command
        await command.execute(interaction, songQueue);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// Login the bot using the token from config.json
client.login(token);

// Export the songQueue so that it's accessible in other files
module.exports = {
    songQueue,
};

const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');  // To read files from the commands folder
const path = require('path');  // To resolve file paths
const { clientId, guildId, token } = require('./config.json');

// Read all command files from the 'commands' folder
const commands = [];
const commandsFolderPath = path.join(__dirname, 'commands');

// Dynamically read the command files in the folder
fs.readdirSync(commandsFolderPath).forEach(file => {
    if (file.endsWith('.js')) {
        // Import the command module (require the file)
        const command = require(path.join(commandsFolderPath, file));

        // Add the command to the array
        commands.push(command.data.toJSON());
    }
});

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // Use the correct route for guild commands (for a specific server)
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),  // Ensure this is correct
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice'); // Import the method to get the connection

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Disconnect the bot from the voice channel'),
    
    async execute(interaction) {
        // Get the connection for the current guild
        const connection = getVoiceConnection(interaction.guild.id);
        
        if (connection) {
            // If there is a connection, destroy it
            connection.destroy();
            await interaction.reply("Disconnected from the voice channel.");
        } else {
            // If there is no connection
            await interaction.reply("I'm not in a voice channel.");
        }
    },
};

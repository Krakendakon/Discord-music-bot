const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice'); // Import necessary components

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song'),

  async execute(interaction) {
    const connection = getVoiceConnection(interaction.guild.id); // Get the voice connection
    if (!connection) {
      return interaction.reply('I am not currently in a voice channel!');
    }

    const player = connection.state.subscription.player; // Access the audio player from the connection

    if (!player || player.state.status !== AudioPlayerStatus.Paused) {
      return interaction.reply('There is no song currently paused to resume.');
    }

    // Resume the paused song
    player.unpause();

    // Send confirmation message
    await interaction.reply('Resumed the current song.');
  },
};

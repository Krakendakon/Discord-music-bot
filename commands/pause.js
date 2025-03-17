const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus, getVoiceConnection, createAudioPlayer } = require('@discordjs/voice'); // Import necessary components

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the currently playing song'),

  async execute(interaction) {
    const connection = getVoiceConnection(interaction.guild.id); // Get the voice connection
    if (!connection) {
      return interaction.reply('I am not currently in a voice channel!');
    }

    const player = connection.state.subscription.player; // Access the audio player from the connection

    if (!player || player.state.status !== AudioPlayerStatus.Playing) {
      return interaction.reply('There is no song currently playing to pause.');
    }

    // Pause the current song
    player.pause();

    // Send confirmation message
    await interaction.reply('Paused the current song.');
  },
};

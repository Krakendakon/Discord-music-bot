const { SlashCommandBuilder } = require('@discordjs/builders');
// Import songQueue and playNextSong from play.js (same directory)
const { songQueue, playNextSong } = require('./play');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song and play the next one'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const queueData = songQueue.get(guildId);

    // Check if there is a song playing or in the queue
    if (!queueData || !queueData.queue.length) {
      return interaction.reply('There are no songs in the queue to skip.');
    }

    // Skip the current song
    queueData.queue.shift(); // Remove the current song from the queue
    queueData.currentSong = queueData.queue[0] || null;  // Set the current song to the next song, or null if no songs left

    // If there is a next song, continue playing it
    if (queueData.queue.length > 0) {
      await playNextSong({ queue: queueData.queue, connection: queueData.connection, player: queueData.player, guildId });
      await interaction.reply('Skipped the current song.');
    } else {
      queueData.connection.destroy();  // No more songs, disconnect
      songQueue.delete(guildId);  // Clear the queue
      await interaction.reply('No more songs in the queue. Disconnected.');
    }
  },
};

const { SlashCommandBuilder } = require('@discordjs/builders');
const { songQueue, playNextSong } = require('./play');  // Import the play logic

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song and play the next one')
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('The number of songs to skip')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply(); // Immediately defer to prevent timeout

    const guildId = interaction.guild.id;
    const queueData = songQueue.get(guildId);

    // Get the number of songs to skip, default to 1 if not provided
    const skipCount = interaction.options.getInteger('count') || 1;

    console.log(`Received /skip command in guild ${guildId} with skip count: ${skipCount}`);

    // Check if there are any songs in the queue
    if (!queueData || !queueData.queue.length) {
      console.log(`No songs in the queue for guild ${guildId}.`);
      return interaction.editReply('There are no songs in the queue to skip.');
    }

    console.log(`Queue before skipping in guild ${guildId}:`, queueData.queue);

    // Ensure we don't try to skip more songs than are in the queue
    const songsToSkip = Math.min(skipCount, queueData.queue.length);
    queueData.queue.splice(0, songsToSkip); // Remove the skipped songs
    queueData.currentSong = queueData.queue[0] || null; // Set the next song or null if no songs are left

    // If there are still songs in the queue, play the next one
    if (queueData.queue.length > 0) {
      console.log(`Skipping ${songsToSkip} song(s). Next song: ${queueData.currentSong}`);
      await playNextSong(guildId);  // Call playNextSong directly, passing the guildId
      await interaction.editReply(`Skipped ${songsToSkip} song(s).`);
    } else {
      // If the queue is empty, disconnect
      console.log(`Queue empty in guild ${guildId}. Disconnecting.`);
      queueData.connection.destroy();
      songQueue.delete(guildId);
      await interaction.editReply('No more songs in the queue. Disconnected.');
    }

    console.log(`Queue after skipping in guild ${guildId}:`, queueData.queue);
  },
};

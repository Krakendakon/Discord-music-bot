const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const ytdl = require('yt-dlp-exec');  // yt-dlp-exec module for calling yt-dlp

// Create and export songQueue so it can be accessed in skip.js
const songQueue = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a YouTube song in the voice channel')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('The URL of the YouTube video')
        .setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString('url');  // Get URL from command option

    if (!url) {
      return interaction.reply('Please provide a valid YouTube URL.');
    }

    try {
      if (!interaction.member.voice.channel) {
        return interaction.reply('You need to join a voice channel first!');
      }

      const guildId = interaction.guild.id;
      if (!songQueue.has(guildId)) {
        songQueue.set(guildId, { queue: [], connection: null, player: null, currentSong: null });
      }

      const queue = songQueue.get(guildId).queue;
      queue.push(url);  // Add new song to the queue

      console.log(`Received /play command with URL: ${url}`);
      console.log(`Queue for guild ${guildId}:`, queue);  // Debugging log

      if (queue.length === 1) {
        const connection = joinVoiceChannel({
          channelId: interaction.member.voice.channel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();

        songQueue.get(guildId).connection = connection;
        songQueue.get(guildId).player = player;
        songQueue.get(guildId).currentSong = url;

        await playNextSong({ queue, connection, player, guildId });

        await interaction.reply(`Now playing: ${url}`);
      } else {
        await interaction.reply(`Added to queue: ${url}`);
      }
    } catch (error) {
      console.error(error);
      await interaction.reply('There was an error trying to play the song.');
    }
  },
};

async function playNextSong(queueData) {
  const { queue, connection, player, guildId } = queueData;

  let nextSongUrl = queueData.currentSong ? queue[0] : null;
  if (!nextSongUrl) {
    nextSongUrl = queue[0];
  }

  console.log(`playNextSong called for guild ${guildId}. Queue length: ${queue.length}`);
  console.log(`Next song URL: ${nextSongUrl}`);  // Debugging log

  const audioStream = ytdl.exec(nextSongUrl, {
    output: '-',
    format: 'bestaudio',
    quiet: true,
  }, { stdio: ['ignore', 'pipe', 'ignore'] });

  const audioUrl = audioStream.stdout;

  console.log(`Playing song from URL: ${nextSongUrl}`);  // Debugging log

  const resource = createAudioResource(audioUrl, {
    inputType: StreamType.Arbitrary,
  });

  player.play(resource);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    queue.shift();  // Remove the song from the queue once it's finished
    if (queue.length > 0) {
      songQueue.get(guildId).currentSong = queue[0];
      playNextSong({ queue, connection, player, guildId });
    } else {
      connection.destroy();
      songQueue.delete(guildId);  // Clear the queue
    }
  });
}

// Export songQueue for access in skip.js
module.exports.songQueue = songQueue;
module.exports.playNextSong = playNextSong;
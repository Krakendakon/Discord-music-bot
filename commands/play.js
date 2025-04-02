const { SlashCommandBuilder } = require('@discordjs/builders');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus, 
  StreamType 
} = require('@discordjs/voice');
const { spawn } = require('child_process'); // Use spawn for yt-dlp
const ytsr = require('ytsr');  // YouTube Search API
const songQueue = new Map(); // Global queue

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song in the voice channel')
    .addStringOption(option => 
      option.setName('input')
        .setDescription('The YouTube URL or search query')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply(); // Prevent timeout while fetching songs

    const input = interaction.options.getString('input');
    let videoUrls = [];

    // Check if input is a URL or a query
    if (isValidUrl(input)) {
      console.log(`Received /play command with URL: ${input}`);
      if (input.includes("list=")) {
        videoUrls = await getPlaylistVideos(input);
        if (videoUrls.length === 0) {
          return interaction.editReply("Failed to fetch playlist videos.");
        }
      } else {
        videoUrls = [input];
      }
    } else {
      console.log(`Received /play command with query: ${input}`);
      videoUrls = await searchYouTube(input);
      if (videoUrls.length === 0) {
        return interaction.editReply("No videos found for the search query.");
      }
    }

    const guildId = interaction.guild.id;
    if (!songQueue.has(guildId)) {
      songQueue.set(guildId, { queue: [], connection: null, player: null });
    }

    const queue = songQueue.get(guildId).queue;
    queue.push(...videoUrls);

    console.log(`Queue for guild ${guildId}:`, queue);

    if (queue.length === videoUrls.length) {
      // Create a new voice connection if none exists
      const connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      songQueue.get(guildId).connection = connection;
      songQueue.get(guildId).player = player;
      connection.subscribe(player);

      await interaction.editReply(`Now playing: ${videoUrls[0]}`);
      playNextSong(guildId);
    } else {
      await interaction.editReply(`Added ${videoUrls.length} songs to the queue.`);
    }
  },
};

// Function to check if a string is a valid URL
function isValidUrl(url) {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return regex.test(url);
}

// Function to search for a song on YouTube and return the best match
async function searchYouTube(query) {
  try {
    const searchResults = await ytsr(query, { limit: 1 }); // Only get the best match
    if (searchResults.items.length > 0) {
      const videoUrls = searchResults.items
        .filter(item => item.type === 'video')
        .map(item => item.url);

      return videoUrls;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
}

// Function to fetch playlist videos
async function getPlaylistVideos(playlistUrl) {
  return new Promise((resolve, reject) => {
    const process = spawn('yt-dlp', ['-j', playlistUrl, '--flat-playlist']);

    let output = '';
    process.stdout.on('data', data => {
      output += data.toString();
    });

    process.on('close', () => {
      try {
        const playlistData = output
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => JSON.parse(line))
          .map(item => `https://www.youtube.com/watch?v=${item.id}`);

        resolve(playlistData);
      } catch (error) {
        console.error('Error fetching playlist:', error);
        reject(error);
      }
    });
  });
}

// Function to play the next song in the queue
async function playNextSong(guildId) {
  const queueData = songQueue.get(guildId);
  if (!queueData || queueData.queue.length === 0) return;

  const { queue, connection, player } = queueData;
  const nextSongUrl = queue[0]; // Get first song in queue

  console.log(`Playing next song for guild ${guildId}: ${nextSongUrl}`);

  const process = spawn('yt-dlp', [
    '-f', 'bestaudio',
    '-o', '-',
    '--quiet', '--no-warnings',
    nextSongUrl
  ], { stdio: ['ignore', 'pipe', 'ignore'] });

  const resource = createAudioResource(process.stdout, { inputType: StreamType.Arbitrary });

  player.play(resource);

  player.once(AudioPlayerStatus.Idle, () => {
    queue.shift(); // Remove the finished song
    if (queue.length > 0) {
      playNextSong(guildId);
    } else {
      console.log(`Queue empty for guild ${guildId}, disconnecting.`);
      connection.destroy();
      songQueue.delete(guildId);
    }
  });

  player.once('error', (error) => {
    console.error(`Error playing audio: ${error.message}`);
    queue.shift(); // Skip the problematic song
    if (queue.length > 0) {
      playNextSong(guildId);
    } else {
      connection.destroy();
      songQueue.delete(guildId);
    }
  });
}

// Export songQueue so other commands can interact with it
module.exports.songQueue = songQueue;
module.exports.playNextSong = playNextSong;

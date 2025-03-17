
# Discord Music bot
A simple music bot for your Discord server Based on, yt-dlp-exec
## Installation

To get started, you'll need to install the required dependencies. Run the following commands in your terminal:


```
npm init -y
npm install discord.js @discordjs/voice yt-dlp-exec @discordjs/rest @discordjs/builders ffmpeg-static
```



This will install all the necessary packages for the bot.

## Running the Bot

Once installed, you can run the bot using the following command:



bash node deploy-commands.js node bot.js




The first command (`deploy-commands.js`) sets up some initial commands and configurations. The second command (`bot.js`) starts the actual music bot.

Note: Make sure to replace `YOUR_BOT_TOKEN` with your actual Discord bot token in the `config.json` file.

## Configuration

You can configure the bot by editing the `config.json` file (if present). This file contains settings such as the bot's prefix, music directory, and more. Consult the comments within the file for details on each setting.

## Troubleshooting

If you encounter any issues while running the bot, check the console output or error logs to see if there are any errors or warnings that can help diagnose the problem.

That's it! With these instructions, you should be able to get your Discord music bot up and running. Happy coding!



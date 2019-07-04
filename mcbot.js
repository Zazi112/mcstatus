///////////////////////////////////////////////
//                                           //
//         Minecraft Server Checker          //
//                Discord Bot                //
//       (github.com/rendrop/mcstatus)       //
//                                           //
//                 7/4/2019                  //
//              Private Release              //
//                                           //
//          copyright: rendrop @2019         //
//                                           //
///////////////////////////////////////////////
//                                           //
//                   Using:                  //
//                                           //
//                McAPI.us API               //
//                 discord.js                //
//                  request                  //
//                                           //
///////////////////////////////////////////////


const Discord = require("discord.js");
const client = new Discord.Client();
// var statustring = "No signal";

var request = require('request');
var mcIP = process.env.mcip; // Your MC server IP
var mcPort = process.env.mcport; // Your MC server port
var prefix = process.env.prefix;
var url = 'http://mcapi.us/server/query?ip=' + mcIP + '&port=' + mcPort;
var status;
var isChecking = false;
var interval;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("Bot is loading", { type: 'PLAYING' })
});

client.on("message", async message => {
	// This event will run on every single message received, from any channel or DM.
	  
	// It's good practice to ignore other bots. This also makes your bot ignore itself
	// and not get into a spam loop (we call that "botception").
	if(message.author.bot) return;
	  
	// Also good practice to ignore any message that does not start with our prefix, 
	// which is set in the server configuration.
	if(message.content.indexOf(prefix) !== 0) return;
	 
	// Here we separate our "command" name, and our "arguments" for the command. 
	// e.g. if we have the message "+say Is this the real life?" , we'll get the following:
	// command = say
	// args = ["Is", "this", "the", "real", "life?"]
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
  
	if(command === "status") {
		message.delete().catch(O_o=>{});
		// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
		// The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
		const m = await message.channel.send("Checking server status...");
		if(!isChecking){
			isChecking = true;
			console.log("Update called");
			client.user.setActivity("Checking server status...", { type: 'PLAYING' });
			interval = setInterval(function(){
				request(url, function(err, response, body) {
					if(err) {
					  console.log(err)
					  .catch(console.error);
					  //return message.reply('Error getting Minecraft server status...');
					}
						body = JSON.parse(body);
						console.log("Online: " + body.online);	
					if(body.online) {
						if((body.motd=="§4This server is offline.\n§7powered by aternos.org")||(body.players.now>=body.players.max)){
							client.user.setStatus('dnd')
							//.then(console.log)
							.catch(console.error);
							m.edit(`Server is offline :(`);
							client.user.setActivity("Server offline", { type: 'PLAYING' });
							isChecking = false;
							clearInterval(interval);
							console.log("Server offline");
						  }else{
							client.user.setStatus('online')
							//.then(console.log)
							.catch(console.error);
						//console.log("Number of player: " + ((body.players.list).counters.length));
							console.log("Server online");
						}
						if(body.players.now) {
							status = ' ' + body.players.now + '  of  ' + body.players.max;
							client.user.setActivity(status);
							m.edit("Server is online! With " + body.players.now + " player(s) currently online.")
						} else {
							status = ' 0  of  ' + body.players.max;
							client.user.setActivity(status);
							m.edit(`Server is online! But it seems empty :(`)
						}
					} else {
						client.user.setStatus('dnd')
						//.then(console.log)
						.catch(console.error);
						isChecking = false;
						clearInterval(interval);
						m.edit(`Server is offline / there is an API error or lag`);
						client.user.setActivity("Server offline / API error :(", { type: 'PLAYING' })
					}
				});
			},5000);
		} else {
			m.edit("There is a check on process");
		}
	}

	if(command === "purge") {
    // This command removes all messages from all users in the channel, up to 100.
    // get the delete count, as an actual number.
	const deleteCount = parseInt(args[0], 10);
    
		// Combined conditions. <3
		if(!deleteCount || deleteCount < 2 || deleteCount > 100)
			return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");
		
		// So we get our messages, and delete them. Simple enough.
		const fetched = await message.channel.fetchMessages({limit: deleteCount});
			message.channel.bulkDelete(fetched)
			.catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
	}

	if(command === "player") {
		message.delete().catch(O_o=>{});
		if(isChecking){
			const p = await message.channel.send("Checking online players...");
			// const d = await message.channel.send("This feature is still on development.");
			setTimeout(function(){
				request(url, function(err, response, body) {
						if(err) {
						console.log(err)
						.catch(console.error);
						return message.reply('Error getting Minecraft server status... (McAPI is down?)');
					}
				body = JSON.parse(body);
					if(body.online) {
						if(body.players.list != null){
							players = body.players.list;
							length = (body.players.list).length;
								var i;
								var playerList = "\n\n"
								for (i = 0; i < length; i++) {
									playerList += "**-**" + players[i] + "\n";
								} 
							// console.log(playerList);
							// console.log(players);
							// console.log(length);
							if(length > 0){
								p.edit(`**Player online:** ` + playerList);
							}
						} else {
							p.edit("There are no players online :(");
						}
					} else {
						p.edit("Error getting player list. The server seems to be offline :(");
					}
				});
			},2000);
		} else {
			const e = await message.channel.send("Please check the server status first!");
		}
	}
	
	if(command === "stop") {
		
		message.delete().catch(O_o=>{});
		const s = await message.channel.send("Stopping server check");
		
		if(isChecking){
			setTimeout(function(){
				clearInterval(interval);
				isChecking = false;
				s.edit("Check stopped");
				client.user.setActivity("Type -help", { type: 'PLAYING' })
			},2000);
		} else {
			s.edit("There is no check ongoing");
		}
	}
	
	if(command === "help") {
		message.delete().catch(O_o={});
		const h = await message.channel.send(`**[mcBot] alpha**\n**by:** *rendrop*\n\n**How to use:**\n\nUse the prefix (" - ") before the command\n\n\n**Command List:**\n\n1. **Help:** Show this help message\n\n2. **Status:** Start the Minecraft server check.\n\n3. **Player:** Show the list of online players (*Can only be done if the server check is running and the server is online*)\n\n4. **Stop:** Stop the Minecraft server check and reset the bot.\n\n**Notes:**\n\nSometimes it takes 2-5 minutes for the API to update.\nThat means sometimes the server check will report that the server is offline/online when it is not.\nThis however is a problem in McAPI system, not the bot.`);
	}	
});

if(!isChecking){
	timeout = setTimeout(function(){
	client.user.setActivity("Type -help", { type: 'PLAYING' })
	}, 5000);
}

//END OF MINECRAFT SERVER CHECK
//
//
// SPOTIFY
//
// Copyright 2018 Campbell Crowley. All rights reserved.
// Author: Campbell Crowley (dev@campbellcrowley.com)
const https = require('https');
require('./subModule.js').extend(Spotify);
/**
 * @classdesc Attempts to play what a user is playing on Spotify, to a voice
 * channel.
 * @class
 * @augments SubModule
 * @listens Command#spotify
 */
function Spotify() {
  const self = this;
  this.myName = 'Spotify';

  let music;

  /**
   * The request to send to spotify to fetch the currently playing information
   * for a user.
   *
   * @private
   * @default
   * @constant
   * @type {object}
   */
  const apiRequest = {
    protocol: 'https:',
    host: 'api.spotify.com',
    path: '/v1/me/player/currently-playing',
    method: 'GET',
    headers: {
      'User-Agent': require('./common.js').ua,
    },
  };

  /** @inheritdoc */
  this.initialize = function() {
    self.command.on('spotify', commandSpotify, true);
    checkMusic();
  };
  /** @inheritdoc */
  this.shutdown = function() {
    self.command.deleteEvent('spotify');
    for (const i in following) {
      if (following[i]) endFollow({guild: {id: i}});
    }
  };
  /** @inheritdoc */
  this.unloadable = function() {
    return true;
  };

  /**
   * The current users we are monitoring the spotify status of, and some related
   * information. Mapped by guild id.
   *
   * @private
   * @type {object}
   */
  const following = {};

  /**
   * Lookup what a user is listening to on Spotify, then attempt to play the
   * song in the requester's voice channel.
   *
   * @private
   * @type {commandHandler}
   * @param {Discord~Message} msg The message that triggered command.
   * @listens Command#spotify
   */
  function commandSpotify(msg) {
    if (!self.bot.accounts) {
      self.common.reply(msg, 'Unable to lookup account information.');
      return;
    }
    let userId = msg.author.id;
    if (msg.mentions.users.size > 0) {
      userId = msg.mentions.users.first().id;
    }
    const subCmd = msg.text.trim().split(' ')[0];
    let infoOnly = false;
    switch (subCmd) {
      case 'info':
      case 'inf':
      case 'playing':
      case 'current':
      case 'currently':
      case 'status':
      case 'stats':
      case 'stat':
        infoOnly = true;
        break;
    }
    if (!infoOnly && music.isSubjugated(msg) && following[msg.guild.id]) {
      endFollow(msg);
      self.common.reply(msg, 'Stopped following Spotify.', '<@' + userId + '>');
      if (following[msg.guild.id] && userId == following[msg.guild.id].user) {
        return;
      }
    }
    getCurrentSong(userId, (err, song) => {
      if (err) {
        if (err == 'Unlinked') {
          self.common.reply(
              msg,
              'Discord account is not linked to Spotify.\nPlease link account' +
                  ' at spikeybot.com to use this command.',
              'https://www.spikeybot.com/account/');
        } else if (err == 'Bad Response') {
          self.common.reply(
              msg, 'Unable to get current Spotify status.',
              'Bad response from Spotify');
        } else if (err == 'Nothing Playing') {
          self.common.reply(msg, 'Not listening to anything on Spotify.');
        } else {
          self.common.reply(msg, 'Unable to get current Spotify status.', err);
        }
        if (infoOnly || err != 'Nothing Playing') return;
      }
      if (infoOnly) {
        self.common.reply(
            msg, 'Song: ' + song.name + '\nArtist: ' + song.artist +
                '\nAlbum: ' + song.album + '\nProgress: ' +
                Math.round(song.progress / 1000) + ' seconds in.\nCurrently ' +
                (song.isPlaying ? 'playing' : 'paused'));
      } else {
        self.common.reply(
            msg,
            'Following Spotify music. Music control is now subjugated by ' +
                'Spotify.\n(Please wait, seeking may take a while)',
            '<@' + userId + '>');
        updateFollowingState(msg, userId, song, true);
        return;
      }
    });
  }

  /**
   * Fetch the current playing song on spotify for the given discord user id.
   *
   * @private
   * @param {string|number} userId The Discord user id to lookup.
   * @param {Fucntion} cb Callback with err, and data parameters.
   */
  function getCurrentSong(userId, cb) {
    self.bot.accounts.getSpotifyToken(userId, (res) => {
      if (!res) {
        cb('Unlinked');
        return;
      }
      const req = https.request(apiRequest, (res) => {
        let content = '';
        res.on('data', (chunk) => {
          content += chunk;
        });
        res.on('end', () => {
          if (res.statusCode == 200) {
            let parsed;
            try {
              parsed = JSON.parse(content);
            } catch (err) {
              self.error('Failed to parse Spotify response: ' + userId);
              console.log(err, content);
              cb('Bad Response');
              return;
            }
            if (!parsed.item) {
              cb('Nothing Playing');
              return;
            }
            const artists = (parsed.item.artists || [])
                .map((a) => {
                  return a.name;
                })
                .join(', ');
            const songInfo = {
              name: parsed.item.name,
              artist: artists,
              album: parsed.item.album.name,
              progress: parsed.progress_ms,
              isPlaying: parsed.is_playing,
              duration: parsed.duration_ms,
            };
            cb(null, songInfo);
          } else if (res.statusCode == 204) {
            cb('Nothing Playing');
          } else {
            self.error(
                'Unable to fetch spotify currently playing info for user: ' +
                userId);
            console.error(content);
            cb(res.statusCode || 'VERY SCARY ERROR');
          }
        });
      });
      req.setHeader('Authorization', 'Bearer ' + res);
      req.end();
    });
  }

  /**
   * Check on the user's follow state and update the playing status to match.
   *
   * @private
   *
   * @param {Discord~Message} msg The message to use as context.
   * @param {string|number} userId The discord user id that we are following.
   * @param {object} [songInfo] If song info is provided, this will not be
   * fetched first. If it is not, the information will be fetched from Spotify
   * first.
   * @param {boolean} [start=false] Should we setup the player with our settings
   * because this is the first run?
   */
  function updateFollowingState(msg, userId, songInfo, start = false) {
    checkMusic();
    if (!start && !music.isSubjugated(msg)) {
      endFollow(msg);
      return;
    }
    if (!songInfo) {
      getCurrentSong(userId, (err, song) => {
        if (err) {
          if (err == 'Nothing Playing') {
            if (!following[msg.guild.id]) {
              following[msg.guild.id] = {};
            }
            following[msg.guild.id].timeout =
                self.client.setTimeout(function() {
                  updateFollowingState(msg, userId, null, true);
                }, 3000);
          } else {
            self.error(err);
          }
          return;
        }
        songInfo = song;
        makeTimeout();
      });
    } else {
      makeTimeout();
    }

    /**
     * Start playing the music, and create a timeout to check the status, or for
     * the next song.
     *
     * @private
     */
    function makeTimeout() {
      if (!start && !music.isSubjugated(msg)) {
        endFollow(msg);
        return;
      }
      music.clearQueue(msg);
      if (start) {
        music.subjugate(msg);
      }
      if (songInfo && (start || songInfo.progress < 60000)) {
        startMusic(msg, songInfo);
      }
      if (following[msg.guild.id] && following[msg.guild.id].timeout) {
        self.client.clearTimeout(following[msg.guild.id].timeout);
      }
      following[msg.guild.id] = {
        user: userId,
        song: songInfo,
        lastUpdate: Date.now(),
      };

      if (!songInfo || songInfo.duration) {
        const delay = songInfo ? (songInfo.duration - songInfo.progress) : 3000;
        following[msg.guild.id].timeout = self.client.setTimeout(function() {
          updateFollowingState(msg, userId);
        }, delay);
      } else {
        following[msg.guild.id].timeout = self.client.setTimeout(function() {
          updateDuration(msg, userId);
        }, 1000);
      }
    }
  }

  /**
   * Fetch the song's length from music because Spotify was unable to provide it
   * for us.
   *
   * @private
   *
   * @param {Discord~Message} msg The context.
   * @param {string|number} userId The user id we are following.
   */
  function updateDuration(msg, userId) {
    checkMusic();
    if (following[msg.guild.id] && following[msg.guild.id].timeout) {
      self.client.clearTimeout(following[msg.guild.id].timeout);
    }
    if (!music.isSubjugated(msg)) {
      endFollow(msg);
      return;
    }
    const dur = music.getDuration(msg);
    const prog = music.getProgress(msg);
    if (dur != null && prog != null) {
      following[msg.guild.id].song.duration = dur * 1000;
      const f = following[msg.guild.id];

      const delay = f.song.duration - f.song.progress;
      following[msg.guild.id].timeout = self.client.setTimeout(function() {
        updateFollowingState(msg, userId);
      }, delay);
    } else {
      following[msg.guild.id].timeout = self.client.setTimeout(function() {
        updateDuration(msg, userId);
      }, 1000);
    }
  }

  /**
   * Attempt to start playing the given song into a voice channel.
   *
   * @private
   * @param {Discord~Message} msg Message that caused this to happen, and to
   * pass into {@link Command} as context.
   * @param {{name: string, artist: string, progress: number}} song The current
   * song information. Name is song name, progress is progress into the song in
   * milliseconds.
   */
  function startMusic(msg, song) {
    checkMusic();
    const seek = Math.round(song.progress / 1000 + (song.progress / 1000 / 5));
    music.playSong(msg, song.name + ' by ' + song.artist, seek, true);
  }

  /**
   * Update current reference to music submodule.
   *
   * @private
   */
  function checkMusic() {
    if (!music || !music.initialized) {
      music = self.bot.getSubmodule('./music.js');
    }
  }

  /**
   * Cleanup and delete data in order to stop following user.
   *
   * @private
   * @param {Discord~Message} msg THe context to clear.
   */
  function endFollow(msg) {
    if (following[msg.guild.id]) {
      self.client.clearTimeout(following[msg.guild.id].timeout);
    }
    delete following[msg.guild.id];
    checkMusic();
    if (music) music.release(msg);
  }
}
module.exports = new Spotify();

//END OF SPOTIFY

client.login(process.env.token);
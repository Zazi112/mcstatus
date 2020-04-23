//////////////////////////////////////////
//					//
//	Minecraft Server Checker	//
//           Discord Bot		//
//	(github.com/rendrop)		//
//                                      //
//	  Private Release		//
//                                      //
//	copyright: rendrop @2019        //
//      				//
//////////////////////////////////////////


const Discord = require("discord.js");
const http = require('http');
var fs = require('fs');
const ffmpeg = require('ffmpeg');
const node = require('nodeactyl');
var opusscript = require("opusscript");
const { Readable } = require('stream');
const client = new Discord.Client();
const nodeClient = node.Client;
var util = require('util');
var URL = require('url');
var request = require('request');
var XMLHttpRequest = global.XMLHttpRequest = require("xhr2");
const EventEmitter = require('events');
class HTMLVideoElement extends EventEmitter {}
global.HTMLVideoElement = HTMLVideoElement;
var mcIP = process.env.mcip; // Read var "mcip" from Heroku ENV
var mcPort = process.env.mcport; // Read var "mcport" from Heroku ENV
var prefix = process.env.prefix; // Read var "prefix" from Heroku ENV
var na_HOST = process.env.host; 
var na_KEY = process.env.key;
var url = 'http://mcapi.us/server/query?ip=' + mcIP + '&port=' + mcPort;
var status;
var version;
var isChecking = false;
var isStarting = false;
var interval;
var interval2;

// HLS STREAMER

var Hls = require('hls.js');

const INITIAL_SIZE = 512000;

class SourceBuffer extends EventEmitter {
	constructor(mimetype) {
		super();
		this._mimetype = mimetype;
		this._buffer = Buffer.alloc(INITIAL_SIZE,0,'binary');
		return this;
	}
	addEventListener(eventName, callback) {
		this.addListener(eventName, callback);
		console.log('sb addEventListener '+eventName);
		//if (eventName != 'error') this.emit(eventName);
	}
	appendBuffer(data) {
		console.log(this._mimetype+' '+data.length+' '+typeof data);
		if (data.length > INITIAL_SIZE) {
			throw new Error('Buffer size exceeded');
		}
		var that = this;
		if (this._mimetype.startsWith('audio')) {
			fs.appendFile('./audio.ts.m4a',new Buffer(data,'binary'),'binary',function(){
				that.emit('onupdateend');
				that.emit('updateend');
			});
		}
		else if (this._mimetype.startsWith('video')) {
			fs.appendFile('./video.ts.mp4',new Buffer(data,'binary'),'binary',function(){
				that.emit('onupdateend');
				that.emit('updateend');
			});
		}
		else if (this._mimetype.startsWith('text')) {
			fs.appendFile('./text.sub',data,'binary',function(){
				that.emit('onupdateend');
				that.emit('updateend');
			});
		}
		else {
			console.log('Unhandled mimetype '+this._mimetype);
		}
	}
	get buffered() {
		return [];
	}
	get mode() {
		return '';//'sequence';
	}
}

class MyMediaSource extends EventEmitter {
	constructor() {
		super();
		this.readyState = 'closed';
		this._sb = {};
		return this;
	}
	get sourceBuffers() {	
		var a = [];
		for (let sb in this._sb) {
			a.push(this._sb[sb]);
		}
		return a;
	}
	addEventListener(eventName,callback) {
		console.log('yelp addEventListener: '+eventName);
		this.addListener(eventName,callback);
		this.readyState = 'open';
		console.log(Object.keys(this._sb).length);
		if (eventName == 'sourceopen') {
			console.log('Fired: '+eventName);
			//this.emit(eventName,this);
		}
	}
	removeEventListener(eventName,blah) {
		console.log('yelp removeEventListener: '+eventName);
		console.log(util.inspect(blah));
		this.removeListener(eventName,blah);
	}
	addSourceBuffer(mimetype) {
		console.log('yelp new buffer for '+mimetype);
		var nb = new SourceBuffer(mimetype);
		this._sb[mimetype] = nb;
		return nb;
	}
	endOfStream(error) {
		console.log('** End of stream: '+error);
		dummyElement.emit('ended');
	}
}

try { fs.unlinkSync('./video.ts.mp4'); } catch (ex) {}
try { fs.unlinkSync('./audio.ts.m4a'); } catch (ex) {}
try { fs.unlinkSync('./text.sub'); } catch (ex) {}

const dummyElement = new HTMLVideoElement();

var msArray = [];

global.window = {};
global.window.URL = global.URL = URL;
global.window.URL.createObjectURL = function(ms) {
	console.log('yelp coURL '+util.inspect(ms));
	ms.emit('sourceopen'); //new
	return URL.parse('test://');
};
global.window.URL.revokeObjectURL = function(ms) {
	console.log('yelp roURL '+util.inspect(ms));
};
global.window.location = {};
global.window.location.href = 'http://there.not/';
global.window.dashjs = {}; // odd but there you go
global.window.MediaSource = global.MediaSource = function(){
	var ms = new MyMediaSource();
	msArray.push(ms);
	return ms;
};
global.MediaSource.isTypeSupported = function(codec){return true}; // we can play anything

global.window.addEventListener = function(event,listener) {console.log('Wanted window event')};
global.document = {};
global.document.readyState = 'complete';
global.document.querySelectorAll = function(x){return[dummyElement]};
global.window.document = global.document;
global.window.DOMParser = require('xmldom').DOMParser; 
global.window.performance = global.performance = {};
global.window.performance.now = function() {return new Date();};
global.window.setTimeout = setTimeout;
global.window.clearTimeout = clearTimeout;
global.navigator = {};
global.navigator.userAgent = 'like Chrome';
global.self = {};
global.self.console = console;

var player;

dummyElement.addEventListener = dummyElement.addListener;

dummyElement.pause = function() {
	console.log('Paused');
	dummyElement.emit('pause');
	dummyElement.emit('play');
	return false;
};
dummyElement.preload = 'auto';
dummyElement.buffered = {};
dummyElement.height = 1080;
dummyElement.width = 1920;
dummyElement.loop = false;
dummyElement.played = {};
dummyElement.removeAttribute = function(attr){};
dummyElement.load = function(l){console.log('**:'+util.inspect(this))};
dummyElement.canPlayType = function(codec){console.log('Got asked about:'+codec);return 'probably'};
dummyElement.nodeName = 'video';
dummyElement.playbackQuality = {};
dummyElement.getVideoPlaybackQuality = function() {return dummyElement.playbackQuality};

//----------------------------------------------------------------------------------
function downloadDash(url) {
	var dashjs = require('dashjs');
	global.dashjs = window.dashjs;
	var mp = dashjs.MediaPlayer();
	player = mp.create();

	player.on('manifestUpdated',function(m){
		console.log('* Got manifestUpdated');
		console.log(util.inspect(m));
	},'dasher');
	player.on('metricAdded',function(m){
		//console.log('* Got metricadded');
		//console.log(util.inspect(m));
	},'dasher');
	player.on('loadedMetadata',function(m){
		console.log('* Got loadedmetadata');
		console.log(util.inspect(m));
		dummyElement.emit('loadedmetadata');
	},'dasher');
	player.on('playbackStarted',function(e){
		console.log('Got a playbackStarted event');
		console.log(util.inspect(e));
		//console.log(util.inspect(dummyElement));
		//dummyElement.emit('play'); // calling play here seems to continue the playback?
		dummyElement.emit('playing');
		dummyElement.emit('canplay');
		dummyElement.emit('progress');
	},'dasher');
	player.on('log',function(l){
		//console.log(l);
	},'dasher');
	player.on('playbackEnded',function(){
		//dummyElement.emit('ended'); // makes playback loop?
	},'dasher');
	player.on('streamTeardownComplete',function(e){
		console.log(util.inspect(e));
		dummyElement.emit('ended');
	},'dasher');

	var debug = player.getDebug();
	console.log(util.inspect(debug));
	debug.setLogToBrowserConsole(true);
	debug.setLogTimestampVisible(true);
	debug.log('Testing debug logging');

	console.log('About to call init');
	player.initialize(dummyElement, url, false); // does an attachSource, last param is autoplay

	console.log(util.inspect(player));
	console.log('About to call seek');
	player.setCurrentTrack(0);
	dummyElement.emit('seeking');
	player.seek(0);
}

//----------------------------------------------------------------------------------
function downloadHls(url) {
	global.navigator.userAgent = 'like Edge';
	dummyElement.addTextTrack = function(tt){
		console.log('** Adding textTrack '+util.inspect(tt));
		return [{}];
	};
	dummyElement.textTracks = {};
	dummyElement.textTracks.addEventListener = function(e,cb) {
		console.log('** Adding eventListener: '+e);	
	};
	var hls = new Hls({debug:true,autoStartLoad:true});
	console.log('Support sufficient: '+Hls.isSupported());
	hls.on(Hls.Events.MEDIA_ATTACHED, function () {
		console.log("video and hls.js are now bound together !");
    	//hls.loadSource('http://www.streambox.fr/playlists/test_001/stream.m3u8');
    	hls.loadSource(url);
	});
    hls.on(Hls.Events.MANIFEST_PARSED,function(n,m) {
	  console.log('Got manifest_parsed');
	  console.log(util.inspect(m));
      //video.play();
	  dummyElement.paused = false;
	  dummyElement.currentTime = 0;
	  dummyElement.emit('pause');
	  dummyElement.emit('playing');
	  //hls.startLoad(-1);
	});
    hls.attachMedia(dummyElement);
}

//----------------------------------------------------------------------------------

// EMBEDS

// Status
const status1 = {
							  "title": ":rocket:  Checking server status :rocket: ",
							  "color": 7502554,
							  "footer": {
								"text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
							  }
							}
const statusOffline = {
	  "description": "Server is: **offline** :x: \n\nStart the server by using `start` command",
	  "color": 7502554,
	  "footer": {
		"text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
	  },
      "image": {
        "url": "https://mcapi.us/server/image?ip=node3.mchost.id&port=30003&title=SCTV%20OKE&theme=dark"
      }
	}
const statusError = {
	  "description": ":x:  **There is an error when connecting to the API** :x: ",
	  "color": 7502554,
	  "footer": {
		"text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
	  }
	}
const isRunning = {
	  "description": ":x:  **The check is already running!** :x: ",
	  "color": 7502554,
	  "footer": {
		"text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
	  }
	}
const stopping = {
      "description": ":clock3:  **Stopping** :clock3: ",
      "color": 7502554,
      "footer": {
        "text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
      }
}
const stopped = {
      "description": ":x:  **Check stopped** :x: ",
      "color": 7502554,
      "footer": {
        "text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
      }
    }
const noCheck = {
      "description": ":x:  **No check ongoing!** :x: ",
      "color": 7502554,
      "footer": {
        "text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
      }
    }

// VPS
const isOnline = {
      "description": ":white_check_mark:  **Server is online** :white_check_mark: ",
      "color": 7502554,
      "footer": {
        "text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
      }
}
const starting = {
      "description": ":rocket:   **Starting server** :rocket: ",
      "color": 7502554,
      "footer": {
        "text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
      }
}
const checking = {
      "description": ":mag:   **Checking VPS server** :mag: ",
      "color": 7502554,
      "footer": {
        "text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
      }
}
const isOffline = {
      "description": " :x:  **Server is offline**  :x: ",
      "color": 7502554,
      "footer": {
        "text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
      }
}


client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setStatus('idle');
  client.user.setActivity("bot is loading", { type: 'STREAMING' })
});

// START OF BOT

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
	
// status command: get minecraft server status
	
	if(command === "status") {
		message.delete().catch(O_o=>{});
		// Send confirmation message
		const m = await message.channel.send({ embed: status1 });
		// Check if the routine is already running or not
		if(!isChecking){
			// Routine is running
			isChecking = true;
			// console.log("Update called");
			// Set bot status
			client.user.setActivity("checking server...", { type: 'STREAMING' });
			// Routine, check server status every 5 seconds
			interval = setInterval(function(){
				request(url, function(err, response, body) {
					if(err) {
					  console.log(err)
					  .catch(console.error);
					  //return message.reply('Error getting Minecraft server status...');
					}
						body = JSON.parse(body);			
						// console.log("Online: " + body.online);	
					if(body.online) {
							client.user.setStatus('online')
							//.then(console.log)
							.catch(console.error);
							version = body.version
							//console.log("Number of player: " + ((body.players.list).counters.length));
							//console.log("Server online");
							// Read the amount of player
							if(body.players.now) {
								// There are player(s) in the server
								// Set bot status
								status = ' ' + body.players.now + '  of  ' + body.players.max;
								client.user.setActivity(status + " | " + version);
								const statusOnline = {
									  "description": ("Server is: **online** :white_check_mark: \n\nRunning **" + version + "** :desktop: \n\nWith **" + body.players.now + "** player(s) currently playing. :man_raising_hand: "),
									  "color": 7502554,
									  "footer": {
										"text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
									  },
									  "image": {
										"url": "https://mcapi.us/server/image?ip=node3.mchost.id&port=30003&title=SCTV%20OKE&theme=dark"
									  }
									}
								// Edit the confirmation message to show the amount of online player
								m.edit({ embed: statusOnline })
							} else if(body.players.now == 0){
								const statusOnline = {
								  "description": ("Server is: **online** :white_check_mark: \n\nRunning **" + version + "** :desktop: \n\nWith **" + body.players.now + "** player(s) currently playing. :man_raising_hand: "),
								  "color": 7502554,
								  "footer": {
									"text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
								  },
								  "image": {
									"url": "https://mcapi.us/server/image?ip=node3.mchost.id&port=30003&title=SCTV%20OKE&theme=dark"
								  }
								}
								// There are no players in the server
								// Set bot status
								status = ' 0  of  ' + body.players.max;
								client.user.setActivity(status + " | " + version);
								// Edit the confirmation message
								m.edit({ embed: statusOnline });
							}
					} else if(!body.online) {
						client.user.setStatus('dnd')
						//.then(console.log)
						.catch(console.error);
						isChecking = false;
						clearInterval(interval);
						m.edit({ embed: statusOffline });
						client.user.setActivity("API error!", { type: 'PLAYING' })
					}
				});
			},10000);
		} else {
			// Routine is already running
			// Send error message
			m.edit({ embed: isRunning });
		}
	}

// purge command: (hidden from the list)

	if(command === "purge") {
    // This command removes all messages from all users in the channel, up to 100.
    // get the delete count, as an actual number.
	const deleteCount = parseInt(args[0], 10);
    
		// Combined conditions. <3
		if(!deleteCount || deleteCount < 2 || deleteCount > 100)
			return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");
		
		// So we get our messages, and delete them. Simple enough.
		const fetched = await message.channel.messages.fetch({limit: deleteCount});
			message.channel.bulkDelete(fetched)
			.catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
	}

// player command: get the list of online players in server 
// (if the server check routine is running)

	if(command === "player" || command === "players") {
		message.delete().catch(O_o=>{});
		// Check if the routine is running
		const playerChecking =     {
				  "description": ":mag_right:  **Checking online players** :mag_right: ",
				  "color": 7502554,
				  "footer": {
					"text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
				  }
				}
		if(isChecking){
			// Send confirmation message
			const p = await message.channel.send({ embed: playerChecking });
			// const d = await message.channel.send("This feature is still on development.");
			setTimeout(function(){
				request(url, function(err, response, body) {
						if(err) {
						console.log(err)
						.catch(console.error);
						// Reply an error message
						return message.reply({ embed: statusError });
					}
				// Get data from McAPI	
				body = JSON.parse(body);
					// Server online?
					if(body.online) {
						// Check player list, is there any data in it?
						if(body.players.list != null){
							// There's data, parsing the list
							players = body.players.list;
							length = (body.players.list).length;
								var i;
								var playerList = "\n\n"
								for (i = 0; i < length; i++) {
									playerList += "**-**" + players[i] + "\n";
								}
							const onlinePlayer = {
								  "title": "**Online Players**",
								  "description": (playerList),
								  "color": 7502554,
								  "footer": {
									"text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
								  }
								}
							// console.log(playerList);
							// console.log(players);
							// console.log(length);
							if(length > 0){
								// Edit the message
								// Show list of online players
								p.edit({ embed: onlinePlayer })
								.catch(error => {
									console.log(error);
								});
							}
						} else {
							const noPlayer = {
								  "title": "**Online Players**",
								  "description": "No player currently online :thinking: ",
								  "color": 7502554,
								  "footer": {
									"text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
								  }
								}
							// There's no data, don't parse the list
							// Edit confirmation message
							p.edit({ embed: noPlayer })
								.catch(error => {
									console.log(error);
								});
						}
					} else {
						// This is a rare error message.
						p.edit({ embed: statusError });
					}
				});
			},2000);
			client.setTimeout(function(){
				p.delete().catch(O_o=>{});
			},20000);
		} else {
			// Routine is not running, send error message
			const plsCheck = {
				  "description": ":x: **Please check server status first** :x:",
				  "color": 7502554,
				  "footer": {
					"text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
				  }
				}
			const e = await message.channel.send({ embed: plsCheck });
			client.setTimeout(function(){
				e.delete().catch(O_o=>{});
			},5000);
		}
	}

// stop command: stop the server check routine

	if(command === "stop") {
		
		message.delete().catch(O_o=>{});
		// Send a confirmation message
		const s = await message.channel.send({ embed: stopping });
		// Check if the routine is running
		if(isChecking){
			// If there routine is running, stop it in ~2 seconds
			setTimeout(function(){
				clearInterval(interval);
				// Reset the bot
				isChecking = false;
				client.user.setStatus('idle');
				client.user.setActivity("b!help", { type: 'LISTENING' })
				// Edit the message
				s.edit({ embed: stopped });
			},2000);
		} else {
			// Routine is not running, edit the message
			s.edit({ embed: noCheck });
		}
		client.setTimeout(function(){
			s.delete().catch(O_o=>{});
		},5000);
	}

// start command: start server
	if(command === "start"){
		message.delete().catch(O_o=>{});
		const st = await message.channel.send({ embed: checking });
		isStarting = true;
		interval2 = setInterval(function(){
			nodeClient.getServerStatus("cbe44c0f").then((status) => {
				// console.log(status);
				if(status === 'off'){
					st.edit({ embed: isOffline });
					client.user.setActivity("Starting server...", { type: 'PLAYING' })
					setTimeout(function(){
						st.edit({ embed: starting });
						nodeClient.startServer("cbe44c0f").then((response) => {
							console.log(response);
						// response will be "Server started successfully"
						}).catch((error) => {
							console.log(error.message);
							isStarting = false;
							clearInterval(interval2);
						});
					},2000);
				} else if(status === 'starting'){
					setTimeout(function(){
						st.edit({ embed: starting })
						isStarting = true;
						client.user.setActivity("Starting server...", { type: 'PLAYING' })
					},2000);
				} else if(status === 'on'){
					setTimeout(function(){
						st.edit({ embed: isOnline });
						clearInterval(interval2);
						isStarting = false;
					},2000);				
				}
			}).catch((error) => {
				console.log(error.message);
				st.edit('Error checking VPS status. Aborting');
				clearInterval(interval2);
				isStarting = false;
				setTimeout(function(){
					st.delete().catch(O_o=>{});
				},5000);
			});
		},7000);
	}

// help command: show help message
	
	if(command === "help") {
		message.delete().catch(O_o={});
		// Help message
		const help = {
		  "title": "> **SCTV OKE** ",
		  "description": ":space_invader: `Official Discord Bot (Alpha Ver.)` :space_invader:\n\n\n>  :notebook_with_decorative_cover: **USAGE**  :notebook_with_decorative_cover:\n\nUse the prefix `b!` before command\n\n\n> :white_check_mark: **COMMANDS** :white_check_mark: \n\n:small_orange_diamond:  **help**: show this message\n:small_orange_diamond:  **status**: start the server status check\n:small_orange_diamond:  **player**: show the list of online player (can only be used if the server is online)\n:small_orange_diamond:  **stop**: stop the server status\n:small_orange_diamond:  **start**: start the VPS server (still buggy sometimes)\n\n\n\n> :notepad_spiral: **NOTES** :notepad_spiral:\n\nSometimes it takes 2-5 minutes for the API to update.\nThat means sometimes the server check will report \nthat the server is offline/online when it is not.\nThis however is a problem in McAPI system, not the bot. :worried:",
		  "color": 7502554,
		  "footer": {
			"text": "Written by: 𝐻𝑒𝓁𝑒𝓃𝒶#5857 © 2020"
		  }
		}
		const hm = await message.channel.send({ embed: help });
	}
	
// radio listening command <mager bgt>

	if(command === "radio") {
		message.delete().catch(O_o={});
		console.log("Radio command issude");
		if(!message.member.voice.channel) {
			console.log("User not in voice channel");
			const e = await message.channel.send("You are not in a voice channel!")
		} else if(message.member.voice.channel) {
			console.log("Joined voice channel");
			const connection = await message.member.voice.channel.join();
			console.log("Playing Prambors");
			downloadHls('http://hls.rastream.com/masima-pramborsjakarta.web.hls/playlist.m3u8?listeningSessionID=5e54063fa0af4f01_5079305_wyn3gO0h_MTAzLjIxLjgxLjM6ODA!_000000dE2qB&downloadSessionID=0&awparams=companionads%3Atrue%3Btags%3Aradioactive%3Bstationid%3Amasima-pramborsjakarta&playerid=Prambors_web&authtoken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvaWQiOiJsYXlsaW8iLCJpYXQiOjE1ODc2NDQxMTksImV4cCI6MTU4NzczMDUxOX0.a3XUDuK6naFDqNezlwAbz-6xDJK6oWf9AV2z5Zj_omM&lan=%5B%22en%22%5D&setLanguage=true');
			const dispatcher = connection.play(fs.createReadStream('audio.ts.m4a'));
			dispatcher.on('start', () => {
			console.log('audio.mp3 is now playing!');
			});
			dispatcher.on('finish', () => {
				console.log('audio.mp3 has finished playing!');
			})
			dispatcher.on('error', console.error);
		}		
	}
})


// Reset the bot periodically if the checking routine stopped.
// Either abruptly by an error or by server going offline, API downtime, and the stop command.

client.setInterval(function(){
	if(!isChecking && !isStarting){
		client.user.setStatus('idle');
		client.user.setActivity("b!help", { type: 'LISTENING' })
	}
}, 10000);

//END OF BOT

client.login(process.env.token); // Discord bot client auth.
nodeClient.login(na_HOST, na_KEY, (logged_in, err) => { // Pterodactyl API client auth.
    console.log("Connected to Pterodactyl API");
	});
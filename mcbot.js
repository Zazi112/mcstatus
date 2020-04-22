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
const client = new Discord.Client();
const node = require('nodeactyl');
const nodeClient = node.Client;
var request = require('request');
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

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setStatus('idle');
  client.user.setActivity("bot is loading", { type: 'STREAMING' })
});

// START OF MINECRAFT SERVER CHECK

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
		const m = await message.channel.send("Checking server status...");
		// Check if the routine is already running or not
		if(!isChecking){
			// Routine is running
			isChecking = true;
			// console.log("Update called");
			// Set bot status
			client.user.setActivity("server status...", { type: 'STREAMING' });
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
						if((body.motd=="Â§4This server is offline.\nÂ§7powered by aternos.org")||(body.players.now>=body.players.max)){
							client.user.setStatus('dnd')
							//.then(console.log)
							.catch(console.error);
							// Server is offline
							// Edit confirmation message
							m.edit(`Server is offline :(`);
							// Edit bot status
							client.user.setActivity("Server offline.", { type: 'PLAYING' });
							// Stop the routine
							isChecking = false;
							clearInterval(interval);
							// console.log("Server offline");
						}else{
							client.user.setStatus('online')
							//.then(console.log)
							.catch(console.error);
							version = body.version
							//console.log("Number of player: " + ((body.players.list).counters.length));
							//console.log("Server online");
						}
							// Read the amount of player
							if(body.players.now) {
								// There are player(s) in the server
								// Set bot status
								status = ' ' + body.players.now + '  of  ' + body.players.max;
								client.user.setActivity(status + " | " + version);
								// Edit the confirmation message to show the amount of online player
								m.edit("========================\n                  Server is **online**!\n                  Running: **" + version + "**\n\n  With **" + body.players.now + "** player(s) currently online.\n========================")
							} else if(body.players.now == 0){
								// There are no players in the server
								// Set bot status
								status = ' 0  of  ' + body.players.max;
								client.user.setActivity(status + " | " + version);
								// Edit the confirmation message
								m.edit(
								`===============\n     Server is **online**!\n     Running: **` + version +`**\n But it seems empty :(\n===============`
								)
							}
					} else {
						client.user.setStatus('dnd')
						//.then(console.log)
						.catch(console.error);
						isChecking = false;
						clearInterval(interval);
						m.edit(`Server is **offline** / there is an API error or lag`);
						client.user.setActivity("Server offline / API error :(", { type: 'PLAYING' })
					}
				});
			},5000);
		} else {
			// Routine is already running
			// Send error message
			m.edit("**Error:** The check is already running");
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
		const fetched = await message.channel.fetchMessages({limit: deleteCount});
			message.channel.bulkDelete(fetched)
			.catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
	}

// player command: get the list of online players in server 
// (if the server check routine is running)

	if(command === "player" || command === "players") {
		message.delete().catch(O_o=>{});
		// Check if the routine is running
		if(isChecking){
			// Send confirmation message
			const p = await message.channel.send("Checking online players...");
			// const d = await message.channel.send("This feature is still on development.");
			setTimeout(function(){
				request(url, function(err, response, body) {
						if(err) {
						console.log(err)
						.catch(console.error);
						// Reply an error message
						return message.reply('Error getting Minecraft server status... (McAPI is down?)');
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
							// console.log(playerList);
							// console.log(players);
							// console.log(length);
							if(length > 0){
								// Edit the message
								// Show list of online players
								p.edit(`**Player online:** ` + playerList);
							}
						} else {
							// There's no data, don't parse the list
							// Edit confirmation message
							p.edit("There are no players online :o");
						}
					} else {
						// This is a rare error message.
						p.edit("Error getting player list. The server seems to be offline :(");
					}
				});
			},2000);
			client.setTimeout(function(){
				p.delete().catch(O_o=>{});
			},20000);
		} else {
			// Routine is not running, send error message
			const e = await message.channel.send("Please check the server status first!");
			client.setTimeout(function(){
				e.delete().catch(O_o=>{});
			},5000);
		}
	}

// stop command: stop the server check routine

	if(command === "stop") {
		
		message.delete().catch(O_o=>{});
		// Send a confirmation message
		const s = await message.channel.send("Stopping server check");
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
				s.edit("Check stopped");
			},2000);
		} else {
			// Routine is not running, edit the message
			s.edit("There is no check ongoing");
		}
		client.setTimeout(function(){
			s.delete().catch(O_o=>{});
		},5000);
	}

// start server
	if(command === "serverstart"){
		message.delete().catch(O_o=>{});
		const st = await message.channel.send("Checking VPS status..");
		isStarting = true;
		interval2 = setInterval(function(){
			nodeClient.getServerStatus("cbe44c0f").then((status) => {
				// console.log(status);
				if(status === 'off'){
					st.edit('Server status: offline');
					client.user.setActivity("Starting server...", { type: 'PLAYING' })
					st.edit("Starting VPS server...");
					setTimeout(function(){
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
						st.edit("Starting VPS server...")
					},2000);
				} else if(status === 'on'){
					setTimeout(function(){
						st.edit("Server status: online");
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
		},2000);
	}
// help command: show help message
	
	if(command === "help") {
		message.delete().catch(O_o={});
		// Help message
		const h = await message.channel.send(`==========================================

:space_invader:                                  **[mcBot: alpha] **                                    :space_invader: 
                                             by: *rendrop*

==========================================

                                     :notebook_with_decorative_cover:  **How to use**  :notebook_with_decorative_cover: 

==========================================

                  Use the prefix (" b! ") before the command

==========================================

                                  :white_check_mark: **Command List** :white_check_mark: 

==========================================

    **Help:** Show this help message

    **Status:** Start the Minecraft server check.

    **Player:** Show the list of online players 
           (*Can only be done if the 
                        server check is running 
                                  and the server is online*)

    **Stop:** Stop the Minecraft server check and reset the bot.


==========================================

                                      :notepad_spiral: **Notes:** :notepad_spiral: 

==========================================

Sometimes it takes 2-5 minutes for the API to update.
That means sometimes the server check will report 
that the server is offline/online when it is not.
This however is a problem in McAPI system, not the bot. :worried:

==========================================

This message will self destruct in 10 seconds

==========================================`);
	client.setTimeout(function(){
			h.delete().catch(O_o=>{});
		},10000);
	}	
});

// Reset the bot periodically if the checking routine stopped.
// Either abruptly by an error or by server going offline, API downtime, and the stop command.

client.setInterval(function(){
	if(!isChecking && !isStarting){
		client.user.setStatus('idle');
		client.user.setActivity("b!help", { type: 'LISTENING' })
	}
}, 10000);

//END OF MINECRAFT SERVER CHECK

client.login(process.env.token); // Discord bot client auth.
nodeClient.login(na_HOST, na_KEY, (logged_in, err) => { // Pterodactyl API client auth.
    console.log(logged_in);
	}).catch((error) => {
		console.log(error.message);
	}
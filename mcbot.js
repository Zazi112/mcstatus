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
  client.user.setActivity("Type +status to check server status", { type: 'PLAYING' })
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
			const d = await message.channel.send("This feature is still on development.");
			setTimeout(function(){
				request(url, function(err, response, body) {
						if(err) {
						console.log(err)
						.catch(console.error);
						return message.reply('Error getting Minecraft server status... (McAPI is down?)');
					}
				body = JSON.parse(body);
					if(body.online) {
						players = body.players.list;
						length = (body.players.list).length;
						console.log(players);
						console.log(length);
						if(length > 0){
							p.edit(`Players: ` + players);
						} else if (length < 1){
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
				s.edit("Check stopped");
				client.user.setActivity("Type +status to check server status", { type: 'PLAYING' })
			},2000);
		} else {
			s.edit("There is no check ongoing");
		}
	}
	
	if(command === "help") {
		message.delete().catch(O_o={});
		const h = await message.channel.send("Help menu is still under development");
	}	
});

if(!isChecking){
	timeout = setTimeout(function(){
	client.user.setActivity("Type +status to check server status", { type: 'PLAYING' })
	}, 5000);
}

client.login(process.env.token);
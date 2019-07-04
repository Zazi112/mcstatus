const Discord = require("discord.js");
const client = new Discord.Client();
var statustring = "No signal";

var request = require('request');
var mcIP = process.env.mcip; // Your MC server IP
var mcPort = process.env.mcport; // Your MC server port
var prefix = process.env.prefix;
var url = 'http://mcapi.us/server/query?ip=' + mcIP + '&port=' + mcPort;
var status;
var statusID;
var isChecking = false;
var interval;

function start(){
	if(!isChecking){
		isChecking = true;
		update();
		interval = setInterval(update, 10000);
	}
}

function playerList(){
	request(url, function(err, response, body) {
		  if(err) {
			  console.log(err)
			  .catch(console.error);
			  return message.reply('Error getting Minecraft server status...');
		  }
		  body = JSON.parse(body);
			if(body.online) {
				players = body.players.list;
				length = (body.players.list).length;
				console.log(players);
				console.log(length);
				client.user
					.send(message)
						.then(message => console.log(`${message.content}`))
						.catch(console.error);
			}
	});
}

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
  // which is set in the configuration file.
  if(message.content.indexOf(prefix) !== 0) return;
  
  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  // Let's go with a few common example commands! Feel free to delete or change those.
  
  if(command === "status") {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Checking server status.");
	if(!isChecking){
		isChecking = true;
		console.log("Update called");
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
						m.edit(`Server is offline.`);
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
							m.edit(`"Server is online! With " + body.players.now + " playing."`)
						  } else {
							status = ' 0  of  ' + body.players.max;
							client.user.setActivity(status);
							m.edit(`Server is online! But it seems empty.`)
						  }
				  } else {
					client.user.setStatus('dnd')
					//.then(console.log)
					.catch(console.error);
					isChecking = false;
					clearInterval(interval);
					m.edit(`Server is offline / there is an API error or lag`);
					client.user.setActivity("Server offline / API error.", { type: 'PLAYING' })
				  }
				if(isChecking){
					console.log("This is a continuous update");
				}
			});
		},10000);
	};
  }
client.login(process.env.token);

const Discord = require("discord.js");
const client = new Discord.Client();
var statustring = "No signal";

var request = require('request');
var mcIP = process.env.mcip; // Your MC server IP
var mcPort = process.env.mcport; // Your MC server port

var url = 'http://mcapi.us/server/query?ip=' + mcIP + '&port=' + mcPort;
var status;
var statusID;
var isChecking = false;
var interval;

function start(){
	if(isChecking){
		isChecking = true;
		update();
		interval = setInterval(update, 10000);
	}
}

function update() {
  console.log("Update called")
  request(url, function(err, response, body) {
      if(err) {
          console.log(err)
          .catch(console.error);
          return message.reply('Error getting Minecraft server status...');
      }
      body = JSON.parse(body);
      console.log("Online: " + body.online);
      if(body.online) {
          if((body.motd=="§4This server is offline.\n§7powered by aternos.org")||(body.players.now>=body.players.max)){
            client.user.setStatus('dnd')
            //.then(console.log)
            .catch(console.error);
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
              } else {
                status = ' 0  of  ' + body.players.max;
        }
      } else {
        client.user.setStatus('dnd')
        //.then(console.log)
        .catch(console.error);
	client.user.setActivity("Can't reach server, Aternos error?", { type: 'PLAYING' })
      }
      client.user.setActivity(status, { type: 'PLAYING' })
      .then(presence => console.log(status))
      .catch(console.error);
  });

}
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log('Bot ready!');
  client.user.setActivity("Type /status to check", { type: 'PLAYING' })
});

client.on("message", (message) => {
  if (message.content === '/status') {
    m = message.channel.send("Aw, I'm getting called. Checking your server status every one minute!");
	m.id = statusID;
	console.log("Message ID: " + m.id);
    client.user.setActivity("Checking server status.", { type: 'PLAYING' });
    start();
  }
});

client.on("message", (message) => {
	if (message.content === '/stop') {
		if(isChecking){
			m = message.channel.send("Stopping the check.");
			client.user.setActivity("Type /status to check", { type: 'PLAYING' })
			interval = clearInterval();
			isChecking = false;
			} else 
				if(!isChecking) {
				m = message.channel.send("There are no server checks in progress.");
				}
	}

client.on("message", (message) => {
  if (message.content.startsWith("ping")) {
    message.channel.send("pong!")
    .catch(console.error);
  }
});

client.login(process.env.token);

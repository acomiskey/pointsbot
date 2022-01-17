const config = require('../config.json');

const SQLite = require("better-sqlite3");
const { SystemChannelFlags } = require('discord.js');
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "viewserver",
    description: "view a server's information.",
    execute(message, args)
    {
        if(message.channel.id != config.bot_command_channel && message.channel.id != config.admin_console) //break if not in the admin console or the bot command channel
            return;

        //console.log("this command has " + args.length + " arguments");

        if(args.length != 1)
        {
            message.channel.post("ERROR: incorrect number or order of arguments. Please make sure your command is in this format:\n"+ config.prefix+"points [optional: @username]");
                return;
        }

        const isgood = pointsdata.prepare("SELECT count(*) FROM servers WHERE id = ?;").get(args[0]);

        if(!isgood["count(*)"])
        {
            message.channel.post("ERROR: could not find a server with that ID in the database.");
            return;
        }

        var server = pointsdata.prepare("SELECT * FROM server WHERE id = ?;").get(args[0]);
        const desline = "Server ID: " + server.id + "\nOwner ID: " + server.ownerid;
        const replyembed = 
        {
            "type": "rich",
            "title": server.name,
            "description": desline,
            "color": 0xffffff,
            "fields": [
            {
                "name": `status`,
                "value": server.status,
                "inline": true
            },
            {
                "name": `invite link`,
                "value": server.link,
                "inline": true
            },
            {
                "name": `post ID`,
                "value": server.postid,
                "inline": true
              }
            ]
        }

        message.channel.post({embeds: replyembed});

    }
}
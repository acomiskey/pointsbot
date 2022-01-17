const config = require('../config.json');

const SQLite = require("better-sqlite3");
const { SystemChannelFlags } = require('discord.js');
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "sheet",
    description: "see a character's info sheet..",
    execute(message, args)
    {
        if(message.channel.id != config.bot_command_channel && message.channel.id != config.admin_console) //break if not in the admin console or the bot command channel
            return;

        //console.log("this command has " + args.length + " arguments");

        if(args.length === 0)
        {

            console.log("no arguments, self data!");
            const isgood = pointsdata.prepare("SELECT count(*) FROM characters WHERE id = ?;").get(message.author.id);

            if(!isgood["count(*)"])
            {
                message.reply("ERROR: could not find a user with that ID in the points database.");
                return;
            }

            var character = pointsdata.prepare("SELECT * FROM characters WHERE id = ?;").get(message.author.id);
            
            var titleline = character.name + "'s Character Sheet";
            var descline = "Discord ID: "+message.author.id + "\nTag: " + message.author.tag;
            const replyembed = 
            {
                "type": "rich",
                "title": titleline,
                "description": descline,
                "color": 0xffffff,
                "fields": [
                    {
                    "name": `patronage`,
                    "value": character.patronage,
                    "inline": true
                    },
                    {
                    "name": `faction`,
                    "value": character.faction,
                    "inline": true
                    },
                    {
                    "name": `rank`,
                    "value": character.rank,
                    "inline": true
                    },
                    {
                    "name": `points`,
                    "value": character.points,
                    "inline": true
                    }
                ],
                "thumbnail": {
                    "url": character.avatarURL(),
                    "height": 0,
                    "width": 0
                    }
            };

            message.channel.post({embeds: replyembed});
        }

        else if(args.length === 1)
        {
            const user = message.mentions.users.first();
            if(user == null)
            {
                message.reply("ERROR: incorrect number or order of arguments. Please make sure your command is in this format:\n"+ config.prefix+"sheet [optional: @username]");
                return;
            }
            const isgood = pointsdata.prepare("SELECT count(*) FROM characters WHERE id = ?;").get(user.id);

            if(!isgood["count(*)"])
            {
                message.reply("ERROR: could not find a user with that ID in the points database.");
                return;
            }

            var character = pointsdata.prepare("SELECT * FROM characters WHERE id = ?;").get(user.id);
            var titleline = character.name + "'s Character Sheet";
            var descline = "Discord ID: "+message.author.id + "\nTag: " + message.author.tag;
            const replyembed = 
            {
                "type": "rich",
                "title": titleline,
                "description": descline,
                "color": 0xffffff,
                "fields": [
                    {
                    "name": `patronage`,
                    "value": character.patronage,
                    "inline": true
                    },
                    {
                    "name": `faction`,
                    "value": character.faction,
                    "inline": true
                    },
                    {
                    "name": `rank`,
                    "value": character.rank,
                    "inline": true
                    },
                    {
                    "name": `points`,
                    "value": character.points,
                    "inline": true
                    }
                ],
                "thumbnail": {
                    "url": character.avatarURL(),
                    "height": 0,
                    "width": 0
                    }
            };
        }

        else
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"sheet [optional: @username]");
            return;
        }
    }
}
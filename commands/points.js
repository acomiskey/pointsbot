const config = require('../config.json');

const SQLite = require("better-sqlite3");
const { SystemChannelFlags } = require('discord.js');
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "points",
    description: "check a character's point total.",
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
            message.reply("You have " + character.points + " points.");
        }

        else if(args.length === 1)
        {
            const user = message.mentions.users.first();
            if(user == null)
            {
                message.reply("ERROR: incorrect number or order of arguments. Please make sure your command is in this format:\n"+ config.prefix+"points [optional: @username]");
                return;
            }
            const isgood = pointsdata.prepare("SELECT count(*) FROM characters WHERE id = ?;").get(user.id);

            if(!isgood["count(*)"])
            {
                message.reply("ERROR: could not find a user with that ID in the points database.");
                return;
            }

            var character = pointsdata.prepare("SELECT * FROM characters WHERE id = ?;").get(user.id);
            message.reply(user.tag + " has " + character.points + " points.");
        }

        else
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"points [optional: @username]");
            return;
        }
    }
}
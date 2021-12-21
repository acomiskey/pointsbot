const config = require('../config.json');

const SQLite = require("better-sqlite3");
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "points",
    description: "check a character's point total.",
    execute(message, args)
    {
        if(message.channel.id != config.admin_console) //break if not in the admin console
            return;

        if(args.length === 0)
        {
            const isgood = pointsdata.prepare("SELECT count(*) FROM characters WHERE id = ?;").get(message.author.id);

            if(!isgood["count(*)"])
            {
                message.reply("ERROR: could not find a user with that ID in the points database.");
                return;
            }

            var character = pointsdata.prepare("SELECT * FROM characters WHERE id = ?;").get(message.author.id);
            message.reply("User has " + character.points + " points.");
        }

        else if(args.length === 1)
        {
            const isgood = pointsdata.prepare("SELECT count(*) FROM characters WHERE id = ?;").get(args[0]);

            if(!isgood["count(*)"])
            {
                message.reply("ERROR: could not find a user with that ID in the points database.");
                return;
            }

            var character = pointsdata.prepare("SELECT * FROM characters WHERE id = ?;").get(args[0]);
            message.reply("User has " + character.points + " points.");
        }

        else
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"points [optional: userID]");
            return;
        }
    }
}
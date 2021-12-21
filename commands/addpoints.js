const config = require('../config.json');

const SQLite = require("better-sqlite3");
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "addpoints",
    description: "increase a character's points total.",
    execute(message, args)
    {
        if(message.channel.id != config.admin_console) //break if not in the admin console
            return;

        if(args.length != 2)
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"addpoints [userID] [points]");
            return;
        }
        const isgood = pointsdata.prepare("SELECT count(*) FROM characters WHERE id = ?;").get(args[0]);

        if(!isgood["count(*)"])
        {
            message.reply("ERROR: could not find a user with that ID in the points database.");
            return;
        }

        var character = pointsdata.prepare("SELECT * FROM characters WHERE id = ?;").get(args[0]);
        character.points += args[1];

        pointsdata.prepare("INSERT OR REPLACE INTO characters (id, points, level, cooldown, patron, faction) VALUES (@id, @points, @level, @cooldown, @patron, @faction);").run(character);
        message.reply("Added " + args[1] + " points to character with id "+ args[0] + ", for a new total of " + character.points + ".");
    }
}
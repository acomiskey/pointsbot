const config = require('../config.json');

const SQLite = require("better-sqlite3");
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "setfaction",
    description: "set an existing character's faction.",
    execute(message, args)
    {
        if(message.channel.id != config.admin_console) //break if not in the admin console
            return;

        if(args.length != 2)
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"setfaction [userID] [faction]");
            return;
        }
        const isgood = pointsdata.prepare("SELECT count(*) FROM characters WHERE id = ?;").get(args[0]);
        if(!isgood["count(*)"])
        {
            message.reply("ERROR: could not find a user with that ID in the points database.");
            return;
        }

        var character = pointsdata.prepare("SELECT * FROM characters WHERE id = ?;").get(args[0]);
        character.faction = args[1];

        pointsdata.prepare("INSERT OR REPLACE INTO characters (id, points, level, cooldown, patron, faction) VALUES (@id, @points, @level, @cooldown, @patron, @faction);").run(character);
        message.reply("Set character with ID "+ args[0] + "'s faction to "+args[1] + ".");
    }
}
const config = require('../config.json');

const SQLite = require("better-sqlite3");
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "setpatron",
    description: "set an existing character's patronage.",
    execute(message, args)
    {
        if(message.channel.id != config.admin_console) //break if not in the admin console
            return;

        if(args.length != 2)
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"setpatron @username [patronage]");
            return;
        }

        const user = message.mentions.users.first();
        if(user == null)
        {
            message.reply("ERROR: incorrect number or order of arguments. Please make sure your command is in this format:\n"+ config.prefix+"setpatron @username [patronage]");
            return;
        }

        const isgood = pointsdata.prepare("SELECT count(*) FROM characters WHERE id = ?;").get(user.id);
        if(!isgood["count(*)"])
        {
            message.reply("ERROR: could not find a user with that ID in the points database.");
            return;
        }

        var character = pointsdata.prepare("SELECT * FROM characters WHERE id = ?;").get(user.id);
        character.patron = args[1];

        pointsdata.prepare("INSERT OR REPLACE INTO characters (id, points, level, cooldown, patron, faction) VALUES (@id, @points, @level, @cooldown, @patron, @faction);").run(character);
        message.reply("Set "+ user.tag + "'s patronage to "+args[1] + ".");
    }
}
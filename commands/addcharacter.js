const config = require('../config.json');

const SQLite = require("better-sqlite3");
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "addcharacter",
    description: "manually add a character to the points database.",
    execute(message, args)
    {
        if(message.channel.id != config.admin_console) //break if not in the admin console
            return;

        if(args.length != 2)
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"addcharacter @username [patronage]");
            return;
        }

        const user = message.mentions.users.first();
        if(user == null)
        {
            message.reply("ERROR: incorrect number or order of arguments. Please make sure your command is in this format:\n"+ config.prefix+"addcharacter @username [patronage]");
            return;
        }
        const character = 
        {
            id : user.id,
            points : 0,
            cooldown : 0,
            level: 0,
            patron : args[1],
            faction : "NONE"
        }

        pointsdata.prepare("INSERT OR REPLACE INTO characters (id, points, level, cooldown, patron, faction) VALUES (@id, @points, @level, @cooldown, @patron, @faction);").run(character);
        message.reply("Added character with ID "+ args[0] + " and patron "+args[1] + ".");
    }
}
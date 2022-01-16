const config = require('../config.json');

const SQLite = require("better-sqlite3");
const { count } = require('console');
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "removecharacter",
    description: "manually remove a character from the points database.",
    execute(message, args)
    {
        if(message.channel.id != config.admin_console) //break if not in the admin console
            return;

        if(args.length != 1)
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"removecharacter @username");
            return;
        }

        const user = message.mentions.users.first();
        if(user == null)
        {
            message.reply("ERROR: incorrect number or order of arguments. Please make sure your command is in this format:\n"+ config.prefix+"removecharacter @username");
            return;
        }

        const isgood = pointsdata.prepare("SELECT count(*) FROM characters WHERE id = ?;").get(user.id);

        if(!isgood["count(*)"])
        {
            message.reply("ERROR: could not find a user with that ID in the points database.");
            return;
        }

        const characterdata = pointsdata.prepare("SELECT * FROM characters WHERE id = ?;").get(user.id);
        pointsdata.prepare("DELETE FROM characters WHERE id = ?;").run(user.id);
        pointsdata.prepare("DELETE FROM threadmembers WHERE charid = ?;").run(user.id);

        message.reply("Removed " + user.tag + ". They had " + characterdata.points + " points.");
        //TODO: remove user from other tables
    }
}
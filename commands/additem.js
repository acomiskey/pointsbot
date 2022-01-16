const config = require('../config.json');

const SQLite = require("better-sqlite3");
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "additem",
    description: "create a new item available for players.",
    execute(message, args)
    {
        if(message.channel.id != config.admin_console) //break if not in the admin console
            return;

        if(args.length != 1)
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"additem [item name]");
            return;
        }

        const user = message.mentions.users.first();
        if(user == null)
        {
            message.reply("ERROR: incorrect number or order of arguments. Please make sure your command is in this format:\n"+ config.prefix+"additem [item name]");
            return;
        }
        const item = 
        {
            name : args[0],
            isactive : "ACTIVE"
        }

        pointsdata.prepare("INSERT OR REPLACE INTO items (name, isactive) VALUES (@name, @isactive);").run(item);
        message.reply("Added "+ args[0] + " to the list of items.");
    }
}
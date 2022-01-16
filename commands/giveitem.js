const config = require('../config.json');

const SQLite = require("better-sqlite3");
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "giveitem",
    description: "give a character an item.",
    execute(message, args)
    {
        if(message.channel.id != config.admin_console) //break if not in the admin console
            return;

        if(args.length != 2)
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"giveitem @username [item name]");
            return;
        }

        const user = message.mentions.users.first();
        if(user == null)
        {
            message.reply("ERROR: incorrect number or order of arguments. Please make sure your command is in this format:\n"+ config.prefix+"giveitem @username [item name]");
            return;
        }

        const isgood = pointsdata.prepare("SELECT count(*) FROM characters WHERE id = ?;").get(user.id);
        if(!isgood["count(*)"])
        {
            message.reply("ERROR: could not find a user with that ID in the points database.");
            return;
        }

        const isitemgood = pointsdata.prepare("SELECT count(*) FROM items WHERE name = ?;").get(args[1]);
        if(!isitemgood["count(*)"])
        {
            message.reply("ERROR: could not find an item with that name in the item database.");
            return;
        }

        var character = pointsdata.prepare("SELECT * FROM characters WHERE id = ?;").get(user.id);
        character.name = args[1];

        const givenitem = 
        {
            itemname : args[1],
            ownerid : user.id,
            islocked : "ITEM"
        }

        pointsdata.prepare("INSERT OR REPLACE INTO inventories (itemname, ownerid, islocked) VALUES (@itemname, @ownerid, @islocked);").run(givenitem);
        message.reply("Added "+ args[1] + " to "+user.tag + "'s inventory.");
    }
}
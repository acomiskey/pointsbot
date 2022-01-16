const config = require('../config.json');

const SQLite = require("better-sqlite3");
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "retireitem",
    description: "retire an item so it can no longer be selected on rankup.",
    execute(message, args)
    {
        if(message.channel.id != config.admin_console) //break if not in the admin console
            return;

        if(args.length != 1)
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"retireitem [item name]");
            return;
        }

        const isgood = pointsdata.prepare("SELECT count(*) FROM items WHERE name = ?;").get(args[0]);
        if(!isgood["count(*)"])
        {
            message.reply("ERROR: could not find an item with that name in the item database.");
            return;
        }

        var item = pointsdata.prepare("SELECT * FROM items WHERE id = ?;").get(args[0]);
        item.isactive = "RETIRED";

        pointsdata.prepare("INSERT OR REPLACE INTO items (name, isactive) VALUES (@name, @isactive);").run(item);
        message.reply("Successfully retired "+ args[0] + ". It can no longer be selected by characters as a rankup reward.");
    }
}
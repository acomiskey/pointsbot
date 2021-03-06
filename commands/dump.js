const config = require('../config.json');

const SQLite = require("better-sqlite3");
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "dump",
    description: "DEBUG: dump a table in the database.",
    execute(message, args)
    {
        if(message.channel.id != config.admin_console) //break if not in the admin console
            return;

        if(args.length != 1)
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"dump [tablename]");
            return;
        }

        if(config.debug_commands_enabled != true)
        {
            message.reply("ERROR: Debug commands are not enabled.");
            return;
        }

        const isgood = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = '?';").get(args[0]);

        if(!isgood["count(*)"])
        {
            message.reply("ERROR: table with name "+ args[0] + " does not exist in the points database.");
            return;
        }

        pointsdata.prepare("DELETE FROM ?;").get(args[0]);
        message.reply("Successfully dumped the table " + args[0] + ".");
    }
}
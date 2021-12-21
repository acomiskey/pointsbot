const config = require('../config.json');

const SQLite = require("better-sqlite3");
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "print",
    description: "DEBUG: print everything in a table in the database.",
    execute(message, args)
    {
        if(message.channel.id != config.admin_console) //break if not in the admin console
            return;

        if(args.length != 1)
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"print [tablename]");
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

        //PRINT STUFF HERE
        message.reply(/*stuff to be printed*/);
    }
}
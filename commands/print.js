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

        const isgood = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = \'" + args[0] + "\';").get();

        if(!isgood["count(*)"])
        {
            message.reply("ERROR: table with name "+ args[0] + " does not exist in the points database.");
            return;
        }

        var output = "";
        const data = pointsdata.prepare("SELECT * FROM " + args[0] + ";").all();

        data.forEach(row => 
            {
                if(args[0] === "characters")
                {
                    output = output + row.id + " " + row.points + " " + row.level + " " + row.cooldown + " " + row.patron + " " + row.faction + "\n";
                }
                else if (args[0] === "threads")
                {
                    output = output + row.id + " " + row.endid + " " + row.wordcount + " " + row.type + " " + row.location + " " + row.status + " " + row.nonmember + "\n";
                }
                else if(args[0] === "threadmembers")
                {
                    output = output + row.threadid + " " + row.charid + " " + row.wordcount + " " + row.postcount + "\n";
                }
                else if (args[0] === "threadtypes")
                {
                    output = output + row.typename + " " + row.description + "\n";
                }
                else if (args[0] === "servers")
                {
                    output = output + row.id + " " + row.name + " " + row.ownerid + " " + row.status + "\n";
                }
                else if (args[0] === "moderators")
                {
                    output = output + row.id + " " + row.modname + " " + row.realname + "\n";
                }
                else output = "error with table type";
            });
        //PRINT STUFF HERE
        message.reply(output);
    }
}
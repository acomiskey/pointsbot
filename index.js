///DEPENDENCIES///

const Discord = require('discord.js');
const fs = require("fs");
const dotenv = require('dotenv');
const config = require('./config.json');
const SQLite = require("better-sqlite3");
const { channel } = require('diagnostics_channel');

///VARIABLES///

const client = new Discord.Client();
client.commands = new Discord.Collection();

dotenv.config();
const pointsdata = new SQLite('./pointsdata.sqlite');

const commandFiles = fs.readdirSync('./commands').filter(file=>file.endsWith('.js'));
for (const file of commandFiles)
    {
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
    }

///FUNCTIONALITY///

client.on("ready", () => {

    //open the existing character points database
    const ctable = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'characters';").get();          //all characters
    const ttable = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'threads';").get();             //all unprocessed threads
    const tmtable = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'threadmembers';").get();     //all characters in unprocessed threads
    const stable = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'servers';").get();             //all affiliate servers where this bot operates
    const mtable = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'moderators';").get();          //all character accounts with moderator status

    //if the table doesn't exist, make a new one
    if(!ctable['count(*)']) 
    {
        //CHARACTER VARIABLES:
        // id: discord user id
        // points: points generated from activity/threads
        // level: character's rank
        // cooldown: time until character can generate points for their posts again
        // patron: character's patron
        // faction: character's faction, if any
        pointsdata.prepare("CREATE TABLE characters (id TEXT PRIMARY KEY, points INTEGER, level INTEGER, cooldown INTEGER, patron TEXT, faction TEXT);").run();
        pointsdata.prepare("CREATE UNIQUE INDEX idx_ct_id ON characters (id);").run();
        pointsdata.pragma("synchronous = 1");
        pointsdata.pragma("journal_mode = wal");
    }

    if(!stable['count(*)']) 
    {
        //SERVER VARIABLES: 
        // id: server's discord id
        // name: the server's name
        // ownerid: the discord id of the server owner
        // status: whether this server is approved, one of:
        //      PENDING: this is a server where the bot has been invited but a moderator has not approved it
        //      APPROVED: this is a server where the bot has been invited and can process threads accordingly
        //      DENIED: this is a server where the bot has been invited, but is not permitted to process threads
        pointsdata.prepare("CREATE TABLE servers (id TEXT PRIMARY KEY, name TEXT, ownerid TEXT, status TEXT);").run();
        pointsdata.prepare("CREATE UNIQUE INDEX idx_serverid ON servers (id);").run();
        pointsdata.pragma("synchronous = 1");
        pointsdata.pragma("journal_mode = wal");
    }

    if(!mtable['count(*)']) 
    {
        //MOD VARIABLES: 
        // id: discord id of mod account
        // modname: the moderator's themed codename
        // realname: the moderator's actual name/pen name/whatever it's discord rp
        pointsdata.prepare("CREATE TABLE moderators (id TEXT PRIMARY KEY, modname TEXT, realname TEXT);").run();
        pointsdata.prepare("CREATE UNIQUE INDEX idx_modid ON moderators (id);").run();
        //add each mod to the table here
        pointsdata.pragma("synchronous = 1");
        pointsdata.pragma("journal_mode = wal");
    }

    if(!ttable['count(*)'])
    {
        //THREAD VARIABLES:
        // id: eight-digit number, incremental
        // wordcount: total wordcount of all characters in the thread
        // type: type of thread; ie, the amount of points it's worth
        // location: foreign key, id of associated server
        // status: processing status, one of:
        //      PENDING: the thread is awaiting moderator approval
        //      ERROR: the thread has some issue that needs to be fixed by a participant
        //      APPROVED: the thread has been approved by a moderator, and points have been disbursed
        //      DENIED: the thread has been permanently denied by a moderator
        pointsdata.prepare("CREATE TABLE threads (id TEXT PRIMARY KEY, wordcount INTEGER, type TEXT, location TEXT NOT NULL, status TEXT, nonmember TEXT);").run();
        pointsdata.prepare("CREATE UNIQUE INDEX idx_charid ON threads (id);").run();
        pointsdata.pragma("synchronous = 1");
        pointsdata.pragma("journal_mode = wal");
    }

    if(!tmtable['count(*)']) 
    {
        //THREADMEMBERS VARIABLES:
        //relational table that links threads with members
        // threadid: foreign key, id of associated thread
        // charid: foreign key, id of associated character
        // wordcount: word count of this character in this thread
        pointsdata.prepare("CREATE TABLE threadmembers (threadid TEXT NOT NULL, charid TEXT NOT NULL, wordcount INTEGER NOT NULL);").run();
        pointsdata.prepare("CREATE INDEX idx_threadid ON threadmembers (threadid);").run();
        pointsdata.pragma("synchronous = 1");
        pointsdata.pragma("journal_mode = wal");
    }

    //character table
    client.getChar = pointsdata.prepare("SELECT * FROM characters WHERE id = ?;");
    client.newChar = pointsdata.prepare("INSERT OR REPLACE INTO characters (id, points, level, cooldown, patron, faction) VALUES (@id, @points, @level, @cooldown, @patron, @faction);");
    client.deleteChar = pointsdata.prepare("DELETE FROM characters WHERE id = ?;");
    client.setCooldown = pointsdata.prepare("INSERT OR REPLACE INTO characters (id, cooldown) VALUES (@id, @cooldown);");
    client.setPoints = pointsdata.prepare("INSERT OR REPLACE INTO characters (id, points) VALUES (@id, @points);");

    //server table
    client.getServer = pointsdata.prepare("SELECT * FROM servers WHERE id = ?;");
    client.newServer = pointsdata.prepare("INSERT OR REPLACE INTO servers(id, name, ownerid, status) VALUES (@id, @name, @ownerid, @status);");
    client.getServersByOwner = pointsdata.prepare("SELECT * FROM servers WHERE ownerid = ?;");
    client.deleteServer = pointsdata.prepare("DELETE FROM servers WHERE id = ?;");

    //thread table

    //threadmembers table
    client.deleteCharFromThreads = pointsdata.prepare("DELETE FROM threadmembers WHERE charid = ?;");

    //moderators table

    console.log("Ready!\n");
});

client.on("guildCreate", guild => //when this bot is invited to a new server 
{
    if(guild.id == config.guild_id) //if this is server prime
    {
        guild.channels.cache.get(admin_console).send("BITIBOT ONLINE! Hello, world!");
    }
    else                            //add the affiliate server as pending to the database
    {

        let owner = client.getChar.run(guild.owner.id);
        if(!owner)
        {
            guild.systemChannel.send("BITIBOT ONLINE! It looks like this server is not owned by an active member of the primary server. This server cannot be validated as an affiliate.");
            guild.leave();
        }

        else
        {
            guild.systemChannel.send("BITIBOT ONLINE! This is not my primary server. I will let the admins know that this server needs to be validated. Please stand by!");
            let server = 
                {
                    id: guild.id,
                    name: guild.name,
                    ownerid: guild.owner.id,
                    status: "PENDING"
                }
            client.newServer.run(server);
            client.channels.cache.get(config.admin_log).send("I was just added to "+guild.name+", with server id " + guild.id+ ". If this is a valid affiliate server, please confirm it with "+config.prefix+"confirm [server id]");
        }
    }
});

client.on('message', message => {

    if(message.author.bot) return;                      //make sure not sent by other bot/self
    if(!message.content.startsWith(config.prefix))      //make sure message is not command
    {
        console.log("this is not a command!");
        if(message.guild.id != config.guild_id) return; //make sure message is in prime server
        if(ValidIC(message.channel))                    //make sure message is in valid IC channel
        {
            console.log("this is a valid IC channel!");
            let character = client.getChar.get(message.author.id);
            const now = Date.now();
            const addition = Math.floor(Math.random() * (config.maxpoints - config.minpoints) + config.minpoints);

            if(character)                               //if author is in the points database
            {
                console.log("this character is in the points database!");
                if((now - character.cooldown >= config.ic_points_cooldown)) // and if not cooldown
                {
                    character.points += addition;
                    character.cooldown = now;
                    client.setCooldown.run(character);
                    console.log("new cooldown time for "+message.author.username+" is "+now+". Next message in "+ config.ic_points_cooldown + " miliseconds.\n");
                    client.setPoints.run(character);
                }
            }
        }
        return;
    }

    //if it has the command prefix, it's a command
    //each command checks if the message is in a suitable channel and if the author has authority to call it
    //most user commands MUST be performed in bot_command_channel
    //thread compilation can occur in any server that the bot is a member of
    //admin commands must be performed in the admin console channel

    console.log("this is a command!\n");
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if(!client.commands.has(commandName)) 
    {
        message.reply("I don't know " + commandName+"!"); 
        return;
    }

    try 
    {
        console.log("i'm executing the command!");
        client.commands.get(commandName).execute(message, args);
    }
    catch (error)
    {
        console.log(error);
        message.reply('I encountered an unknown error trying to execute '+ commandName + ". Please contact your server admin.");
    }
});

client.on('guildMemberAdd', member =>
{
    if(member.guild.id == config.guild_id) //if the member has joined server prime
    {
        if(member.user.bot) return; //do not add bots to the points database
        const character = 
                {
                    id : member.user.id,
                    points : 0,
                    level : 0,
                    cooldown : 0,
                    patron: "NEW",
                    faction: "NONE"
                }

        client.newChar.run(character);
        client.channels.cache.get(config.admin_log).send("New character "+ member.user.tag+" has been added to the database. Please add their patronage using the command "+ config.prefix+"patron.");
    }
    return;
});

client.on('guildMemberRemove', member =>
{
    if(member.guild.id == config.guild_id) //if the member left or was kicked from server prime
    {
        if(member.user.bot) return; //bots don't get put in the database anyway

        let character = client.getChar.get(member.user.id);
        if(!character)  //this should literally never happen, but just in case, note when a rando leaves the server
        {
            client.channels.cache.get(config.admin_log).send("A character who was not registered in the points database ("+member.user.id+") just left the server.");
            return;
        }

        client.deleteChar.run(character.id); //remove the character from the points database
        client.deleteCharFromThreads.run(character.id);
        client.channels.cache.get(config.admin_log).send("Character "+ member.user.tag+ " has left the server. They had "+ character.points+" points.");

        let servers = client.getServersByOwner.all(member.id); //leave any affiliate servers that this character owns
        for(var c = 0; c < servers.length; c++)
        {
            client.guilds.cache.get(server[c].id).leave();
            client.channels.cache.get(config.admin_log).send("Leaving server "+ servers[c].name +" because it was owned by "+ member.user.tag+".");
            client.deleteServer.run(server[c].id);
        }
        
    }
});

client.login(process.env.TOKEN);

function ValidIC(channel)
{
    const category = channel.parent;
    var isvalid = false;

    for(var i in config.ic_categories)
    {
        if(category.id == config.ic_categories[i])
        {
            isvalid = true;
        }
    }

    for(var j in config.misc_ic_channels)
    {
        if(channel.id == config.misc_ic_channels[j])
        {
            isvalid = true;
        }
    }

    return isvalid;
}
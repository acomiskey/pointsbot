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
    const tmtable = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'threadmembers';").get();      //all characters in unprocessed threads
    const typetable = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'threadtypes';").get();    //all valid thread types + their point  values
    const stable = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'servers';").get();             //all affiliate servers where this bot operates
    const mtable = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'moderators';").get();          //all character accounts with moderator status
    const invtable = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'inventories';").get();       //all inventory items of all charcters
    const ittable = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'items';").get();              //all possible items
    const rtable = pointsdata.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'ranks';").get();               //all ranks

    //if the table doesn't exist, make a new one
    if(!ctable['count(*)']) 
    {
        //CHARACTER VARIABLES:
        // id: discord user id
        // name: the character's name as it appears on their application
        // points: points generated from activity/threads
        // currentrank: name of this character's rank
        // rankupready: whether a rankup is ready, one of:
        //      1: rankup is ready
        //      0: rankup is not ready
        // cooldown: time until character can generate points for their posts again
        // patron: character's patron
        // faction: character's faction, if any
        pointsdata.prepare("CREATE TABLE characters (id TEXT PRIMARY KEY, name TEXT, points INTEGER, currentrank TEXT, rankupready INTEGER, cooldown INTEGER, patron TEXT, faction TEXT);").run();
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
        // link: an invite link to this server
        // postid: the id of the post that lists this server in the main server's directory
        pointsdata.prepare("CREATE TABLE servers (id TEXT PRIMARY KEY, name TEXT, ownerid TEXT NOT NULL, status TEXT, link TEXT, postid TEXT);").run();
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
        // id: messageID of first message in the thread
        // wordcount: total wordcount of all characters in the thread
        // type: type of thread; ie, the amount of points it's worth
        // location: foreign key, id of associated server
        // status: processing status, one of:
        //      PENDING: the thread is awaiting moderator approval
        //      ERROR: the thread has some issue that needs to be fixed by a participant
        //      APPROVED: the thread has been approved by a moderator, and points have been disbursed
        //      DENIED: the thread has been permanently denied by a moderator
        // nonmember: a list of all non-members in the thread, separated by spaces
        pointsdata.prepare("CREATE TABLE threads (id TEXT PRIMARY KEY, endid TEXT NOT NULL, wordcount INTEGER, type TEXT, location TEXT NOT NULL, status TEXT, nonmember TEXT);").run();
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
        // postcount: post count of this character in this thread
        pointsdata.prepare("CREATE TABLE threadmembers (threadid TEXT NOT NULL, charid TEXT NOT NULL, wordcount INTEGER NOT NULL, postcount INTEGER NOT NULL);").run();
        pointsdata.prepare("CREATE INDEX idx_threadid ON threadmembers (threadid);").run();
        pointsdata.pragma("synchronous = 1");
        pointsdata.pragma("journal_mode = wal");
    }

    if(!typetable['count(*)']) 
    {
        //THREADTYPE VARIABLES:
        // typename: the name of this type
        // description: explanation of this thread type
        // minwordcount: minimum wordcount to qualify for points on this thread type
        // minpostcount: minimum post count to qualify for points on this type of thread
        // value: points value of this thread type
        // status: whether this type of thread is currently active, one of:
        //      ACTIVE: new threads can be compiled with this type
        //      RETIRED: new threads cannot be compiled with this type anymore
        pointsdata.prepare("CREATE TABLE threadtypes (typename TEXT PRIMARY KEY, description TEXT, minwordcount INTEGER, minpostcount INTEGER, value INTEGER, status TEXT);").run();
        pointsdata.prepare("CREATE INDEX idx_tyt_id ON threadtypes (typename);").run();
        pointsdata.pragma("synchronous = 1");
        pointsdata.pragma("journal_mode = wal");
    }

    if(!ittable['count(*)']) 
    {
        //ITEM VARIABLES:
        // name: the item's name
        // description: a brief description of the item
        // isactive: whether characters can currently select this item on rankup, one of:
        //      ACTIVE: characters cannot select this item on rankup
        //      RETIRED: character CAN select this item on rankup
        pointsdata.prepare("CREATE TABLE items (name TEXT PRIMARY KEY, isactive TEXT);").run();
        pointsdata.prepare("CREATE UNIQUE INDEX idx_itt_id ON items (name);").run();
        pointsdata.pragma("synchronous = 1");
        pointsdata.pragma("journal_mode = wal");
    }

    if(!invtable['count(*)']) 
    {
        //INVENTORY VARIABLES:
        // itemname: the name of the item or ability slot
        //       ABILITY SLOT NAME FORMAT: "SLOT #", where # > 0 && # < 8
        // ownerid: discord id of the item's owner
        // islocked: whether this item is a locked ability slot, one of:
        //       LOCKED: this item is a slot, and it's locked
        //       UNLOCKED: this item is a slot, and it's unlocked
        //       ITEM: this item is not a slot at all
        pointsdata.prepare("CREATE TABLE inventories (itemname TEXT NOT NULL, ownerid TEXT NOT NULL, islocked TEXT NOT NULL);").run();
        pointsdata.pragma("synchronous = 1");
        pointsdata.pragma("journal_mode = wal");
    }

    if(!rtable['count(*)']) 
    {
        //RANK VARIABLES:
        //name: the rank's name
        //threshold: the threshold at which a character LEAVES that rank
        //benefits: a brief description of benefits this rank confers
        pointsdata.prepare("CREATE TABLE ranks (name TEXT PRIMARY KEY, threshold INTEGER NOT NULL, benefits TEXT);").run();
        pointsdata.prepare("CREATE UNIQUE INDEX idx_rt_id ON ranks (name);").run();
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
    else //await addserver command
    {

        let owner = client.getChar.run(guild.owner.id);
        if(!owner)
        {
            guild.systemChannel.send("BITIBOT ONLINE! It looks like this server is not owned by an active member of the primary server. This server cannot be validated as an affiliate.");
            guild.leave();
        }

        else
        {
            guild.systemChannel.send("BITIBOT ONLINE! This is not my primary server. You can now return to the primary server and run the addserver command in order to complete the registration process.");
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
                    character.points = parseInt(character.points) + parseInt(addition);
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

        //TODO: create a new character's inventory
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

        //TODO: remove this character's inventory from the database
        //TODO: remove this character from any pending threads
        
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
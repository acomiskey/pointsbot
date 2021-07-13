///DEPENDENCIES///

const Discord = require('discord.js');
const fs = require("fs");
const dotenv = require('dotenv');
const config = require('./config.json');
const SQLite = require("better-sqlite3");

///VARIABLES///

const client = new Discord.Client();
client.commands = new Discord.Collection();

dotenv.config();
const iccooldown = config.ic_points_cooldown;
const chartable = new SQLite('./chartable.sqlite');

//const commandFiles = fs.readdirSync('./commands').filter(file=>file.endsWith('.js'));
/*for (const file of commandFiles)
    {
        const command = require("./commands/${file}");
        client.commands.set(command.name, command);
    }*/

///FUNCTIONALITY///

client.on("ready", () => {
    const table = chartable.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'chartable';").get();
    if(!table['count(*)']) 
    {
        chartable.prepare("CREATE TABLE chartable (id TEXT PRIMARY KEY, points INTEGER, level INTEGER, cooldown INTEGER, patron TEXT, faction TEXT);").run();
        chartable.prepare("CREATE UNIQUE INDEX idx_ct_id ON chartable (id);").run();
        chartable.pragma("synchronous = 1");
        chartable.pragma("journal_mode = wal");
    }
    client.newChar = chartable.prepare("INSERT OR REPLACE INTO chartable (id, points, level, cooldown) VALUES (@id, @points, @level, @cooldown);");
    client.getChar = chartable.prepare("SELECT * FROM chartable WHERE id = ?");
    client.removeChar = chartable.prepare("DELETE FROM chartable WHERE id = ?;")
    
    client.getPatron = chartable.prepare("SELECT patron from chartable WHERE id = ?;");
    client.setPatron = chartable.prepare("INSERT OR REPLACE INTO chartable (id, patron) VALUES (@id, @patron);");

    client.getFaction = chartable.prepare("SELECT faction FROM chartable WHERE id = ?;");
    client.setFaction = chartable.prepare("INSERT OR REPLACE INTO chartable (id, faction) VALUES (@id, @faction);");
    
    client.getLevel = chartable.prepare("SELECT level FROM chartable WHERE id = ?;");
    client.setLevel = chartable.prepare("INSERT OR REPLACE INTO chartable (id, level) VALUES (@id, @level)");

    client.getScore = chartable.prepare("SELECT points FROM chartable WHERE id = ?;");
    client.setScore = chartable.prepare("INSERT OR REPLACE INTO chartable (id, points) VALUES (@id, @points);");

    client.getCooldown = chartable.prepare("SELECT cooldown FROM chartable WHERE id = ?;")
    client.setCooldown = chartable.prepare("INSERT OR REPLACE INTO chartable (id, cooldown) VALUES (@id, @cooldown);");

    console.log("Ready!\n");
});

client.on('message', message => {
    if(!message.content.startsWith(process.env.PREFIX)) //if not command
    {
        if(message.author.bot||!message.guild) return; //and not sent by bot/in DMs
        if(message.channel.name.startsWith(config.ic_prefix)) //sent in valid ic channel
        {
            let character = client.getChar.get(message.author.id);
            const now = Date.now();
            const addition = Math.floor(Math.random() * (config.maxpoints - config.minpoints) + config.minpoints);
            if(character) //if author has sent before
            {
                if((now - character.cooldown >= config.ic_points_cooldown))//if not cooldown
                {
                    character.points+= addition;
                    character.cooldown = now;
                    client.setCooldown.run(character);
                    console.log("new cooldown time for "+message.author.username+" is "+now+". Next message in "+ config.ic_points_cooldown + " miliseconds.\n");
                    client.setScore.run(character);
                    return;
                }
            }
            else //else add new author to collection
            {
                character = 
                {
                    id : message.author.id,
                    points : addition,
                    level : 0,
                    cooldown : now
                }
                client.newChar.run(character);
                console.log("\nnew cooldown time for "+message.author.username+" is "+now);
            }
        }
        return;
    }

    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if(!client.commands.has(commandName)) 
    {
        message.reply("I don't know " + commandName+"!"); 
        return;
    }

    try 
    {
        client.commands.get(commandName).execute(message, args);
    }
    catch (error)
    {
        console.error(error);
        message.reply('I encountered an error trying to execute '+ commandName + ". Make sure your parameters are in the correct order!");
    }
});

client.login(process.env.TOKEN);
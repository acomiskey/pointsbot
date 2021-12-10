const config = require('../config.json');

const SQLite = require("better-sqlite3");
const pointsdata = new SQLite('./pointsdata.sqlite');

module.exports = 
{
    name: "compilethread",
    description: "compile a thread",
    execute(message, args)
    {
        const servergood = pointsdata.prepare("SELECT count(*) from servers WHERE id = ?;").get(message.guild.id); //make sure this server is in the database
        if(!servergood['count(*)'])
        {
            if(message.guild.id != config.guild_id)
            {
                message.reply("ERROR: This server is not registered in my database. Ask your server moderators for help registering!");
                return;
            }
        }
        const serverstatus = pointsdata.prepare("SELECT status FROM servers WHERE id = ?").get(message.guild.id); //make sure this server is approved
        if(message.guild.id != config.guild_id)
        {
            if(serverstatus.status != "APPROVED")
            {
                message.reply("ERROR: This server is not approved for thread processing. Ask your server moderators for help getting approved!");
                return;
            }
        }
       

        if(args.length != 3)  //make sure correct # of arguments
        {
            message.reply("ERROR: Incorrect number of arguments. Please make sure your command is in this format:\n"+config.prefix+"compilethread [id of first message] [id of last message] [thread type]");
            return;
        }

        var firstmsg;
        var secondmsg;
        var currentmsg;
        const wordcounts = new Map();
        var totalwords = 0;
        var nmember = "";

        const getMessages = () =>
        {
            message.channel.messages.fetch(args[0])
                .then((message1) => 
                {
                    firstmsg = message1;
                    console.log(firstmsg.cleanContent);
                    message.channel.messages.fetch(args[1])
                    .then((message2) =>
                    {
                        secondmsg = message2;
                        console.log(secondmsg.cleanContent);
                        if(firstmsg.createdTimestamp >= secondmsg.createdTimestamp) //make sure in chronological order
                        {
                            message.reply("ERROR: The first message was posted after the second message. Please make sure your command is in this format:"+config.prefix+"compilethread [id of first message] [id of last message] [thread type]");
                            return;
                        }
                        
                        currentmsg = firstmsg;

                        const processMessage = (current) =>
                        {
                            console.log(current.content);
                            const words = current.cleanContent.trim().split(/ +/);  //separate and count words
                            totalwords += words;

                            if(wordcounts.has(current.author.id))                   //if user already exists in map, add this wordcount to total
                            {
                                const currentcount = wordcounts.get(current.author.id);
                                wordcounts.set(current.author.id, currentcount+words.length);
                            }
                            else //otherwise, add them to the map
                            {
                                const userdata = pointsdata.prepare("SELECT count(*) FROM characters WHERE id = ?").get(currentmsg.author.id);

                                if(!userdata['count(*)'])
                                {
                                    nmember += current.author.tag;
                                    nmember += " ";
                                }
                                wordcounts.set(currentmsg.author.id, words.length);
                            }

                            if(currentmsg.id === secondmsg.id)
                            {
                                console.log("Processed all messages in this thread. Breaking the loop!");
                                return;
                            }
                            else
                            { 
                                currentmsg.channel.messages.fetch( {limit: 1, after: currentmsg.id} )
                                    .then(nextmessage => {currentmsg = nextmessage; console.log(currentmsg.content); processMessage(currentmsg);})
                                    .catch(console.error);
                            }
                        }

                        processMessage(currentmsg);

                    })
                    .catch((error) => 
                    {
                        message.reply("ERROR: the second message you gave me is not in the same channel as your command. Please run this command in the same channel that you wrote your thread.");
                        console.log(error);
                        return -1;
                    });
                })
                .catch((error) =>
                {
                    message.reply("ERROR: the first message you gave me is not in the same channel as your command. Please run this command in the same channel that you wrote your thread.");
                    return -1;
                });
            return 1;
        }

        var messagelocation = getMessages(); //make sure messages in same channel as each other/command
        if(messagelocation == -1)
        {
            console.log("error with location of messages relative to command");
            return;
        }

        wordcounts.forEach((values, keys) => 
        {
            const chardata =
            {
                threadid : message.id,
                charid : keys,
                wordcount : values
            };

            pointsdata.prepare("INSERT OR REPLACE INTO threadmembers (threadid, charid, wordcount) VALUES (@threadid, @charid, @wordcount);").run(chardata);
        });

        const threaddata = 
        {
            id : message.id,
            wordcount : totalwords,
            type : args[3],
            location : message.guild.id,
            status : "PENDING",
            nonmember : nmember
        };
        pointsdata.prepare("INSERT OR REPLACE INTO threads (id, wordcount, type, location, status, nonmember) VALUES (@id, @wordcount, @type, @location, @status, @nonmember);").run(threaddata);
        message.reply("Your thread has been compiled and is currently PENDING. It had "+wordcounts.size+" participants and a total word count of " + totalwords+ ".");
        return;
    }
};
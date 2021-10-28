const fs = require("fs");


module.exports = 
{
    name: 'setup',
    description: 'change basic server settings',
    execute(message, args)
    {
        fs.readFile("../config.json", "utf8", (err, data) => 
        {
            if(err)
            {
                console.log("Error reading config file in setup!\n");
            }
            else
            {
                const config = JSON.parse(data);
                if(message.guild.available && message.guild.name == config.guild_name && message.channel.name.equals(config.admin_console_channel) && message.member.roles.cache.has(config.admin_role))
                {
                    message.reply("Hello admin! Please indicate which setting you would like to change:\n1. IC points cooldown \n2.IC point minimum\n 3.IC point maximum");
                    
                }
                return;
            }
        })
    },
};
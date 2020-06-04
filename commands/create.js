const Discord = require("discord.js");
const fs = require("fs");

exports.run = async(client, message, args) => {
    // Create the channel itself
    let channel = await message.guild.channels.create('wagers');
    channel.createOverwrite(message.guild.id, { VIEW_CHANNEL: true, SEND_MESSAGES: false });

    // Set the important values
    let gamemodes = ['Duels', 'Survival Games', 'Skywars', 'Bedwars'];
    let emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
    let text = "";

    // Add all the gamemodes and emojis to text
    for(let i = 0; i < gamemodes.length; i++) text += `${emojis[i]} ${gamemodes[i]}\n`;

    // Set the message and send it
    let wagerEmbed = new Discord.MessageEmbed()
    .setTitle(`Wagers`)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(`Select one of the gamemodes below.\n\n${text}`)
    .setColor(client.config.color)
    let wagerMessage = await channel.send(wagerEmbed);

    // Set the config stuff 
    for(let i = 0; i < gamemodes.length; i++) wagerMessage.react(emojis[i]);

    // Set the config stuff
    let config = require("../config");
    config.wager.channel = channel.id;
    config.wager.message = wagerMessage.id;
    fs.writeFileSync(`./config.json`, JSON.stringify(config));
}
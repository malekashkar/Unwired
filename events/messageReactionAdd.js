const Discord = require("discord.js");
const fs = require("fs");

module.exports = async(client, reaction, user) => {
    let message = reaction.message;

    if(user.bot) return;
    if(reaction.message.partial) await reaction.message.fetch();
    if(message.id !== client.config.wager.message) return;

    let config = JSON.parse(fs.readFileSync(`./config.json`));

    function size() {
        let amount;

        if(config.opened <= 10) {
            amount = `000${config.opened++}`
        } else if(config.opened <= 100) {
            amount = `00${config.opened++}`
        } else if(config.opened <= 1000) {
            amount = `0${config.opened++}`
        } else {
            amount = `${config.opened++}`
        }

        fs.writeFileSync(`./config.json`, JSON.stringify(config));
        return amount;
    }

    if(reaction.emoji.name === "1️⃣") {
        reaction.users.remove(user);
        await user.createDM();
        // First question
        let embed = new Discord.MessageEmbed().setDescription(`1. What is your (team's) IGN(s)?`)
        user.send(embed);

        // First collector
        let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
        collector.on('collect', m => {
            let team = m.content;

            // Second Question
            embed.setDescription(`2. How much are you looking to wager? This number will be how much you and your opponent are adding to the pot individually. Minimum $.50.`)
            user.send(embed);

            // Second Collector
            let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
            collector.on('collect', m => {
                let amount = parseInt(m.content);

                // Third Question
                embed.setDescription(`3. Is this a 1v1, 2v2, or 4v4, etc?`)
                user.send(embed);

                // Third Collector
                let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id && ['1v1', '2v2', '3v3', '4v4'].includes(m.content.toLowerCase()), { max: 1 });
                collector.on('collect', m => {
                    let size = m.content;

                    // Fourth Question
                    embed.setDescription(`4. What is your opponent's IGN(s)?`)
                    user.send(embed);

                    // Fourth Collector
                    let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                    collector.on('collect', m => {
                        let opponentIGN = m.content;

                        // Fifth Question
                        embed.setDescription(`5. What is your opponent's Discord Tag(s) (Example Deposit#0001)? Make sure to insert their discord tag exactly as shown in the example, with all capitalization correct and no space between the name and tag. If clan battling, just include the tag of the leader.`)
                        user.send(embed);

                        // Fifth Collector
                        let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                        collector.on('collect', m => {
                            let opponent = client.users.cache.find(x => x.tag === m.content);
                            if(!opponent) return user.send(`🚫 No User Found! Please try again...`);
                            if(opponent.tag === user.tag) return user.send(`🚫 You cannot play yourself! Please try again...`);

                            // Sixth Question
                            embed.setDescription(`6. Which server are you looking to Duel on? Your available options are:\n\n- Minemen\n- Hypixel\n- PvP Land\n- Velt\n- Codex`)
                            user.send(embed);
    
                            // Sixth Collector
                            let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id && ['minemen', 'hypixel', 'pvp land', 'velt', 'codex'.includes(m.content.toLowerCase())], { max: 1 });
                            collector.on('collect', m => {
                                let server = m.content;
    
                                function modes(mode) {
                                    let text = "";

                                    if(mode === 'minemen') text = `__Minemen__\n- NoDebuff\n- Sumo\n- Build UHC\n- Combo\n- Classic\n- Spleef`
                                    if(mode === 'hypixel') text = `__Hypixel__\n- UHC\n- Bridge\n- Classic\n- SkyWars`
                                    if(mode === 'pvp land') text = `__PvP Land__\n- NoDebuff\n- Build UHC`
                                    if(mode === 'velt') text = `__Velt__\n- NoDebuff\n- Build UHC\n- Parkour`
                                    if(mode === 'codex') text = `__Codex__\n- Hub Duels`

                                    return text;
                                }

                                // Seventh Question
                                embed.setDescription(`7. Which mode would you like to duel in? Your available options are:\n\n${modes(server.toLowerCase())}`)
                                user.send(embed);
        
                                // Seventh Collector
                                let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                                collector.on('collect', m => {
                                    let mode = m.content;
        
                                    // Eigth Question
                                    embed.setDescription(`8. When would you like for this duel to take place? (Time, time zone, date)`)
                                    user.send(embed);
            
                                    // Eigth Collector
                                    let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                                    collector.on('collect', m => {
                                        let time = m.content;
            
                                        // Ninth Question
                                        embed.setDescription(`9. Are you ready to submit? Is there any extra info you'd like to add?`)
                                        user.send(embed);
                
                                        // Ninth Collector
                                        let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                                        collector.on('collect', async m => {
                                            let extra = m.content;
                
                                            let finalEmbed = new Discord.MessageEmbed()
                                            .setTitle(`Duels`)
                                            .setDescription(`You’ve been challenged to a wager! React with the check mark if you accept the duel!`)
                                            .setColor(client.config.color)
                                            .setThumbnail(user.displayAvatarURL())
                                            .addField(`Team/IGN`, team, true)
                                            .addField(`Wager`, amount, true)
                                            .addField(`Team Size`, size, true)
                                            .addField(`Oponent IGN`, opponentIGN, true)
                                            .addField(`Opponent`, opponent, true)
                                            .addField(`Server`, server, true)
                                            .addField(`Mode`, mode, true)
                                            .addField(`Time`, time, true)
                                            .addField(`Extra`, extra, true)
                                            .setFooter(user.id);

                                            let msg = await opponent.send(finalEmbed).then(a => {
                                                a.react('✅');
                                                a.react('🚫');
                                            })
                                            .catch(e => user.send(`🚫 User has their DM's closed! We cannot request a match from him.`));

                                            let eCollector = msg.createReactionCollector((reaction, u) => ["✅", "🚫"].includes(reaction.emoji.name), { max: 1 });
                                            eCollector.on('collect', async(reaction, user) => {
                                                let chan = await message.guild.channels.create(`${size()}-${user.username}-${opponent.username}`, {type: "text"});
                                                chan.createOverwrite(message.guild.id, {VIEW_CHANNEL: false, SEND_MESSAGES: false})
                                                chan.createOverwrite(opponent, {VIEW_CHANNEL: true, SEND_MESSAGES: true});
                                                chan.createOverwrite(user, {VIEW_CHANNEL: true, SEND_MESSAGES: true});
                                        
                                                chan.send(`${user} ${opponent}`).then(a => a.delete({timeout: 1000}));
                                                chan.send(finalEmbed);
                                            });
                                        });                                           
                                    });      
                                });
                            });
                        });        
                    });
                });
            });
        });
    }
    
    if(reaction.emoji.name === "2️⃣") {
        reaction.users.remove(user);
        await user.createDM();
        // First question
        let embed = new Discord.MessageEmbed().setDescription(`1. What is your (team's) IGN(s)?`)
        user.send(embed);

        // First collector
        let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
        collector.on('collect', m => {
            let team = m.content;

            // Second Question
            embed.setDescription(`2. How much are you looking to wager? This number will be how much you and your opponent are adding to the pot individually. Minimum $.50.`)
            user.send(embed);

            // Second Collector
            let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
            collector.on('collect', m => {
                let amount = parseInt(m.content);

                // Third Question
                embed.setDescription(`3. Is this a 1v1, 2v2, or 4v4, etc?`)
                user.send(embed);

                // Third Collector
                let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id && ['1v1', '2v2', '3v3', '4v4'].includes(m.content.toLowerCase()), { max: 1 });
                collector.on('collect', m => {
                    let size = m.content;

                    // Fourth Question
                    embed.setDescription(`4. What is your opponent's IGN(s)?`)
                    user.send(embed);

                    // Fourth Collector
                    let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                    collector.on('collect', m => {
                        let opponentIGN = m.content;

                        // Fifth Question
                        embed.setDescription(`5. What is your opponent's Discord Tag(s) (Example Deposit#0001)? Make sure to insert their discord tag exactly as shown in the example, with all capitalization correct and no space between the name and tag. If clan battling, just include the tag of the leader.`)
                        user.send(embed);

                        // Fifth Collector
                        let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                        collector.on('collect', m => {
                            let opponent = client.users.cache.find(x => x.tag === m.content);
                            if(!opponent) return user.send(`🚫 No User Found! Please try again...`);
                            if(opponent.tag === user.tag) return user.send(`🚫 You cannot play yourself! Please try again...`);

                            // Sixth Question
                            embed.setDescription(`6. Which server are you looking to Duel on? Your available options are:\n\n- MC Central\n- Backplay\n- MCSG\n- Mineplex`)
                            user.send(embed);
    
                            // Sixth Collector
                            let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id && ['mc central', 'backplay', 'mcsg', 'mineplex'.includes(m.content.toLowerCase())], { max: 1 });
                            collector.on('collect', m => {
                                let server = m.content;
    
                                function modes(mode) {
                                    let text = "";

                                    if(mode === 'mc central') text = `MC Central\n- Direct 1v1/Clan Battle (win-based)\n- Pub smash 1v1/Clan Battle (point-based)`
                                    if(mode === 'backplay') text = `__Blackplay__\n- Direct 1v1\n- Clan Battle`
                                    if(mode === 'mcsg') text = `__MCSG__\n- Direct 1v1\n- Clan Battle`
                                    if(mode === 'mineplex') text = `__Mineplex__\n- Direct 1v1/Clan Battle (win-based)\n- Pub smash 1v1/Clan Battle (point-based)`

                                    return text;
                                }

                                // Seventh Question
                                embed.setDescription(`7. Which mode would you like to duel in? Your available options are:\n\n${modes(server.toLowerCase())}`)
                                user.send(embed);
        
                                // Seventh Collector
                                let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                                collector.on('collect', m => {
                                    let mode = m.content;
        
                                    // Eigth Question
                                    embed.setDescription(`8. When would you like for this duel to take place? (Time, time zone, date)`)
                                    user.send(embed);
            
                                    // Eigth Collector
                                    let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                                    collector.on('collect', m => {
                                        let time = m.content;
            
                                        // Ninth Question
                                        embed.setDescription(`9. Are you ready to submit? Is there any extra info you'd like to add?`)
                                        user.send(embed);
                
                                        // Ninth Collector
                                        let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                                        collector.on('collect', async m => {
                                            let extra = m.content;
                
                                            let finalEmbed = new Discord.MessageEmbed()
                                            .setTitle(`Survival Games`)
                                            .setDescription(`You’ve been challenged to a wager! React with the check mark if you accept the duel!`)
                                            .setColor(client.config.color)
                                            .setThumbnail(user.displayAvatarURL())
                                            .addField(`Team/IGN`, team, true)
                                            .addField(`Wager`, amount, true)
                                            .addField(`Team Size`, size, true)
                                            .addField(`Oponent IGN`, opponentIGN, true)
                                            .addField(`Opponent`, opponent, true)
                                            .addField(`Server`, server, true)
                                            .addField(`Mode`, mode, true)
                                            .addField(`Time`, time, true)
                                            .addField(`Extra`, extra, true)
                                            .setFooter(user.id);

                                            let msg = await opponent.send(finalEmbed).then(a => {
                                                a.react('✅');
                                                a.react('🚫');
                                            })
                                            .catch(e => user.send(`🚫 User has their DM's closed! We cannot request a match from him.`));

                                            let eCollector = msg.createReactionCollector((reaction, u) => ["✅", "🚫"].includes(reaction.emoji.name), { max: 1 });
                                            eCollector.on('collect', async(reaction, user) => {
                                                let chan = await message.guild.channels.create(`${size()}-${user.username}-${opponent.username}`, {type: "text"});
                                                chan.createOverwrite(message.guild.id, {VIEW_CHANNEL: false, SEND_MESSAGES: false})
                                                chan.createOverwrite(opponent, {VIEW_CHANNEL: true, SEND_MESSAGES: true});
                                                chan.createOverwrite(user, {VIEW_CHANNEL: true, SEND_MESSAGES: true});
                                        
                                                chan.send(`${user} ${opponent}`).then(a => a.delete({timeout: 1000}));
                                                chan.send(finalEmbed);
                                            });
                                        });                                           
                                    });      
                                });
                            });
                        });        
                    });
                });
            });
        });
    }
    
    if(reaction.emoji.name === "3️⃣") {
        reaction.users.remove(user);
        await user.createDM();
        // First question
        let embed = new Discord.MessageEmbed().setDescription(`1. What is your (team's) IGN(s)?`)
        user.send(embed);

        // First collector
        let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
        collector.on('collect', m => {
            let team = m.content;

            // Second Question
            embed.setDescription(`2. How much are you looking to wager? This number will be how much you and your opponent are adding to the pot individually. Minimum $.50.`)
            user.send(embed);

            // Second Collector
            let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
            collector.on('collect', m => {
                let amount = parseInt(m.content);

                // Third Question
                embed.setDescription(`3. Is this a 1v1, 2v2, or 4v4, etc?`)
                user.send(embed);

                // Third Collector
                let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id && ['1v1', '2v2', '3v3', '4v4'].includes(m.content.toLowerCase()), { max: 1 });
                collector.on('collect', m => {
                    let size = m.content;

                    // Fourth Question
                    embed.setDescription(`4. What is your opponent's IGN(s)?`)
                    user.send(embed);

                    // Fourth Collector
                    let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                    collector.on('collect', m => {
                        let opponentIGN = m.content;

                        // Fifth Question
                        embed.setDescription(`5. What is your opponent's Discord Tag(s) (Example Deposit#0001)? Make sure to insert their discord tag exactly as shown in the example, with all capitalization correct and no space between the name and tag. If clan battling, just include the tag of the leader.`)
                        user.send(embed);

                        // Fifth Collector
                        let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                        collector.on('collect', m => {
                            let opponent = client.users.cache.find(x => x.tag === m.content);
                            if(!opponent) return user.send(`🚫 No User Found! Please try again...`);
                            if(opponent.tag === user.tag) return user.send(`🚫 You cannot play yourself! Please try again...`);

                            // Sixth Question
                            embed.setDescription(`6. Which server are you looking to Duel on? Your available options are:\n\n- Hypixel\n- Mineplex`)
                            user.send(embed);
    
                            // Sixth Collector
                            let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id && ['hypixel', 'mineplex'.includes(m.content.toLowerCase())], { max: 1 });
                            collector.on('collect', m => {
                                let server = m.content;
    
                                function modes(mode) {
                                    let text = "";

                                    if(mode === 'hypixel') text = `__Hypixel__\n- Direct 1v1/Clan Battle (win-based)\n- Pub smash 1v1/Clan Battle (point-based)`
                                    if(mode === 'mineplex') text = `__Mineplex__\n- Direct 1v1/Clan Battle (win-based)\n- Pub smash 1v1/Clan Battle (point-based)`

                                    return text;
                                }

                                // Seventh Question
                                embed.setDescription(`7. Which mode would you like to duel in? Your available options are:\n\n${modes(server.toLowerCase())}`)
                                user.send(embed);
        
                                // Seventh Collector
                                let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                                collector.on('collect', m => {
                                    let mode = m.content;
        
                                    // Eigth Question
                                    embed.setDescription(`8. When would you like for this duel to take place? (Time, time zone, date)`)
                                    user.send(embed);
            
                                    // Eigth Collector
                                    let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                                    collector.on('collect', m => {
                                        let time = m.content;
            
                                        // Ninth Question
                                        embed.setDescription(`9. Are you ready to submit? Is there any extra info you'd like to add?`)
                                        user.send(embed);
                
                                        // Ninth Collector
                                        let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                                        collector.on('collect', async m => {
                                            let extra = m.content;
                
                                            let finalEmbed = new Discord.MessageEmbed()
                                            .setTitle(`Skyways`)
                                            .setDescription(`You’ve been challenged to a wager! React with the check mark if you accept the duel!`)
                                            .setColor(client.config.color)
                                            .setThumbnail(user.displayAvatarURL())
                                            .addField(`Team/IGN`, team, true)
                                            .addField(`Wager`, amount, true)
                                            .addField(`Team Size`, size, true)
                                            .addField(`Oponent IGN`, opponentIGN, true)
                                            .addField(`Opponent`, opponent, true)
                                            .addField(`Server`, server, true)
                                            .addField(`Mode`, mode, true)
                                            .addField(`Time`, time, true)
                                            .addField(`Extra`, extra, true)
                                            .setFooter(user.id);

                                            let msg = await opponent.send(finalEmbed).then(a => {
                                                a.react('✅');
                                                a.react('🚫');
                                            })
                                            .catch(e => user.send(`🚫 User has their DM's closed! We cannot request a match from him.`));

                                            let eCollector = msg.createReactionCollector((reaction, u) => ["✅", "🚫"].includes(reaction.emoji.name), { max: 1 });
                                            eCollector.on('collect', async(reaction, user) => {
                                                let chan = await message.guild.channels.create(`${size()}-${user.username}-${opponent.username}`, {type: "text"});
                                                chan.createOverwrite(message.guild.id, {VIEW_CHANNEL: false, SEND_MESSAGES: false})
                                                chan.createOverwrite(opponent, {VIEW_CHANNEL: true, SEND_MESSAGES: true});
                                                chan.createOverwrite(user, {VIEW_CHANNEL: true, SEND_MESSAGES: true});
                                        
                                                chan.send(`${user} ${opponent}`).then(a => a.delete({timeout: 1000}));
                                                chan.send(finalEmbed);
                                            });
                                        });                                           
                                    });      
                                });
                            });
                        });        
                    });
                });
            });
        });
    }
    
    if(reaction.emoji.name === "4️⃣") {
        reaction.users.remove(user);
        await user.createDM();
        // First question
        let embed = new Discord.MessageEmbed().setDescription(`1. What is your (team's) IGN(s)?`)
        user.send(embed);

        // First collector
        let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
        collector.on('collect', m => {
            let team = m.content;

            // Second Question
            embed.setDescription(`2. How much are you looking to wager? This number will be how much you and your opponent are adding to the pot individually. Minimum $.50.`)
            user.send(embed);

            // Second Collector
            let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
            collector.on('collect', m => {
                let amount = parseInt(m.content);

                // Third Question
                embed.setDescription(`3. Is this a 1v1, 2v2, or 4v4, etc?`)
                user.send(embed);

                // Third Collector
                let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id && ['1v1', '2v2', '3v3', '4v4'].includes(m.content.toLowerCase()), { max: 1 });
                collector.on('collect', m => {
                    let size = m.content;

                    // Fourth Question
                    embed.setDescription(`4. What is your opponent's IGN(s)?`)
                    user.send(embed);

                    // Fourth Collector
                    let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                    collector.on('collect', m => {
                        let opponentIGN = m.content;

                        // Fifth Question
                        embed.setDescription(`5. What is your opponent's Discord Tag(s) (Example Deposit#0001)? Make sure to insert their discord tag exactly as shown in the example, with all capitalization correct and no space between the name and tag. If clan battling, just include the tag of the leader.`)
                        user.send(embed);

                        // Fifth Collector
                        let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                        collector.on('collect', m => {
                            let opponent = client.users.cache.find(x => x.tag === m.content);
                            if(!opponent) return user.send(`🚫 No User Found! Please try again...`);
                            if(opponent.tag === user.tag) return user.send(`🚫 You cannot play yourself! Please try again...`);

                            // Sixth Question
                            embed.setDescription(`6. Which server are you looking to Duel on? Your available options are:\n\n- Hypixel\n- Mineplex`)
                            user.send(embed);
    
                            // Sixth Collector
                            let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id && ['hypixel'.includes(m.content.toLowerCase())], { max: 1 });
                            collector.on('collect', m => {
                                let server = m.content;

                                // Seventh Question
                                embed.setDescription(`7. Which mode would you like to duel in? Your available options are:\n\n__Hypixel__\n- Direct 1v1/Clan Battle (win-based)\n- Pub smash 1v1/Clan Battle (point-based)`)
                                user.send(embed);
        
                                // Seventh Collector
                                let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                                collector.on('collect', m => {
                                    let mode = m.content;
        
                                    // Eigth Question
                                    embed.setDescription(`8. When would you like for this duel to take place? (Time, time zone, date)`)
                                    user.send(embed);
            
                                    // Eigth Collector
                                    let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                                    collector.on('collect', m => {
                                        let time = m.content;
            
                                        // Ninth Question
                                        embed.setDescription(`9. Are you ready to submit? Is there any extra info you'd like to add?`)
                                        user.send(embed);
                
                                        // Ninth Collector
                                        let collector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { max: 1 });
                                        collector.on('collect', async m => {
                                            let extra = m.content;
                
                                            let finalEmbed = new Discord.MessageEmbed()
                                            .setTitle(`Bedwars`)
                                            .setDescription(`You’ve been challenged to a wager! React with the check mark if you accept the duel!`)
                                            .setColor(client.config.color)
                                            .setThumbnail(user.displayAvatarURL())
                                            .addField(`Team/IGN`, team, true)
                                            .addField(`Wager`, amount, true)
                                            .addField(`Team Size`, size, true)
                                            .addField(`Oponent IGN`, opponentIGN, true)
                                            .addField(`Opponent`, opponent, true)
                                            .addField(`Server`, server, true)
                                            .addField(`Mode`, mode, true)
                                            .addField(`Time`, time, true)
                                            .addField(`Extra`, extra, true)

                                            let msg = await opponent.send(finalEmbed).then(a => {
                                                a.react('✅');
                                                a.react('🚫');
                                            })
                                            .catch(e => user.send(`🚫 User has their DM's closed! We cannot request a match from him.`));

                                            let eCollector = msg.createReactionCollector((reaction, u) => ["✅", "🚫"].includes(reaction.emoji.name), { max: 1 });
                                            eCollector.on('collect', async(reaction, user) => {
                                                let chan = await message.guild.channels.create(`${size()}-${user.username}-${opponent.username}`, {type: "text"});
                                                chan.createOverwrite(message.guild.id, {VIEW_CHANNEL: false, SEND_MESSAGES: false})
                                                chan.createOverwrite(opponent, {VIEW_CHANNEL: true, SEND_MESSAGES: true});
                                                chan.createOverwrite(user, {VIEW_CHANNEL: true, SEND_MESSAGES: true});
                                        
                                                chan.send(`${user} ${opponent}`).then(a => a.delete({timeout: 1000}));
                                                chan.send(finalEmbed);
                                            });
                                        });                                           
                                    });      
                                });
                            });
                        });        
                    });
                });
            });
        });
    }
}
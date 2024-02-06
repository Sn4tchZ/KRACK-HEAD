const { Events } = require('discord.js');
const {Lobbys} = require('../utils/lobbys.js');

module.exports = {
	name: Events.InteractionCreate,
	once: false,
    on: true,
	async execute(interaction) {
        try {
            if (!interaction.isChatInputCommand()){
                if (interaction.isButton()) {
                    let data = await interaction.customId.split("_");
                    //console.log(Lobbys);
                    //console.log(data);
                    let lobby = await Lobbys[data.slice(-1)];
                    if (data[0] == "join" && lobby != undefined) {
                        
                        await lobby.addPlayer(interaction.user.id);
                        await interaction.deferUpdate();
                    }
                    if (data[0] == "leave" && lobby != undefined){
                        await lobby.removePlayer(interaction.user.id);
                        await interaction.deferUpdate();
                    }
                    if (data[0] == "ready" && lobby != undefined){
                        await lobby.readyPlayer(interaction.user.id);
                        await interaction.deferUpdate();
                    }
                    
                }
            } 

            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            
            await command.execute(interaction).catch(async (error)=>
            {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            });
        }catch(error){
            console.log(error);
        }
	}
};
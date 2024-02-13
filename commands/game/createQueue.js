const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, PermissionsBitField } = require('discord.js');
const {Lobby} = require('../../utils/lobby.js');
const {Lobbys} = require('../../utils/lobbys.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('create_queue')
		.setDescription('Register to partitipate to InHouse queues !')
        .addStringOption(option =>
            option.setName('queue_name')
                .setDescription('The name you want to give the queue')
                .setRequired(true)
                )
        .addStringOption(option =>
            option.setName('category_id')
                .setDescription('The category id where the queue is supposed to go')
                .setRequired(true)
                )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
        const chanName = await interaction.options.getString('queue_name').replace(" ","-");
        const categoryId = await interaction.options.getString('category_id');
        interaction.guild.channels.create({
            name: `${chanName}`,
            type: ChannelType.GuildText,
            parent: categoryId,
        }).then(async (channel)=>{
            await channel.lockPermissions();
            await channel.permissionOverwrites.edit('1201861728447762442', { SendMessages: false });
            await channel.permissionOverwrites.edit('1202052171462623272', { SendMessages: true, ViewChannel: true,ReadMessageHistory: true });
            const id = Date.now();
            Lobbys[id] = new Lobby(channel,id,categoryId);
            await Lobbys[id].init();
        }).catch((error)=>{
            interaction.reply('there was en error creating the lobby, retry making sure the category id is the good valid');
            console.log(error);
        });
        
        //interaction.guild.channels.cache.find(channel => channel.name === chanName).setParent('1202184523740368916');
        //await registerUserService(discordId,discordName,lolName,lolRank);
		//await interaction.reply(`${lolName} \n${lolRank}`);
	},
};
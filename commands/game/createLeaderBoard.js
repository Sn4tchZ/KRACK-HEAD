const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {Leaderboard} = require('../../utils/leaderboard');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create_leader_board')
		.setDescription('Creates a leaderboard')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {

        const LBoard = await new Leaderboard(interaction.channel,Date.now())
        
        await LBoard.init();
	},
};
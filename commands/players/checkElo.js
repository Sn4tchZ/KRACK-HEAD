const { SlashCommandBuilder } = require('discord.js');
const {getUserElo} = require('../../services/userServices.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check_elo')
		.setDescription('Check your elo, or give a user_id to check his elo')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('The id of the user you want to get the elo from')
                .setRequired(false)
                ),
	async execute(interaction) {
        let userId = interaction.options.getString('user_id');
        if (!userId) userId = interaction.user.id;
        const elo = await getUserElo(userId);
		await interaction.reply(`The elo of <@${userId}> is ${elo} !`);
	},
};
const { SlashCommandBuilder } = require('discord.js');
const {Lobbys} = require('../../utils/lobbys.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('end_game')
		.setDescription('Ending game and selecting winner')
        .addStringOption((option) =>
            option.setName('winner')
                .setDescription('The winning team')
                .setRequired(true)
                .addChoices(
                    { name: 'Blue', value: 'Blue' },
                    { name: 'Red', value: 'Red' }
                )),
	async execute(interaction) {
        const channelName = interaction.channel.name;

        interaction.options.getString('winner') == 'Blue' 
        ? await Lobbys[channelName].endGame(true)
        : await Lobbys[channelName].endGame(false);

        await interaction.reply(channel.name);
	},
};
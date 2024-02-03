const { SlashCommandBuilder } = require('discord.js');
const {registerUserService} = require('../../services/userServices.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register to partitipate to InHouse queues !')
        .addStringOption((option) =>
            option.setName('rank')
                .setDescription('Your rank in soloqueue')
                .setRequired(true)
                .addChoices(
                    { name: 'Challenger', value: 'Chall' },
                    { name: 'Grand Master', value: 'GM' },
                    { name: 'Master', value: 'Mast' },
                    { name: 'Diamond', value: 'Diam' },
                    { name: 'Emerald', value: 'Em' },
                    { name: 'Platine', value: 'Plat' },
                    { name: 'Gold', value: 'Gold' },
                    { name: 'Silver', value: 'Silv' },
                    { name: 'Bronze', value: 'BR' },
                    {name: 'Iron', value: 'Iron'}
                ))
        .addStringOption(option =>
            option.setName('invocator_name')
                .setDescription('The text before the #')
                .setRequired(true)
                )
        .addStringOption(option =>
            option.setName('hashtag')
                .setDescription('The text after the # without the #')
                .setRequired(true)
                ),
	async execute(interaction) {
        const lolName = interaction.options.getString('invocator_name') + '#' + interaction.options.getString('hashtag');
        const lolRank = interaction.options.getString('rank');
        const discordId = interaction.user.id;
        const discordName = interaction.user.username
        await registerUserService(discordId,discordName,lolName,lolRank);
		await interaction.reply("You've registered successfully");
	},
};
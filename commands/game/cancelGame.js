const { SlashCommandBuilder } = require('discord.js');
const { Lobby } = require('../../utils/lobby.js');
const {Lobbys} = require('../../utils/lobbys.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cancel_game')
		.setDescription('cancel_game')
        .addStringOption(option =>
            option.setName('game_id')
                .setDescription('the game id (name of the text channel)')
                .setRequired(true)
                ),
	async execute(interaction) {
		const lobby = interaction.options.getString('game_id');
        await Lobbys[lobby].stopGame();
	},
};
const { SlashCommandBuilder } = require('discord.js');
const { Lobby } = require('../../utils/lobby.js');
const {Lobbys} = require('../../utils/lobbys.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cancel_lobby')
		.setDescription('cancel_lobby')
        .addStringOption(option =>
            option.setName('lobby_id')
                .setDescription('the lobby id (number at the bottom of the queue message)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const lobby = interaction.options.getString('lobby_id');
        console.log(Lobbys[lobby]);
        await Lobbys[lobby].stopLobby();
	},
};
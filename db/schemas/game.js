const { Schema, mongoose } = require('mongoose');

const GameSchema = new Schema({
    blueTeam: {
        type: mongoose.SchemaTypes.Array,
        required: true,
    },
    redTeam: {
        type: mongoose.SchemaTypes.Array,
        required: true,
    },
    winner: {
        type: mongoose.SchemaTypes.String,
        required: false,
    }
}, {
    timestamps: true
});
const Game = mongoose.model('games', GameSchema)
module.exports = {Game};
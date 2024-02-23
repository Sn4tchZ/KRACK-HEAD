const { Schema, mongoose } = require('mongoose');

const UserSchema = new Schema({
    discordId: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true,
    },
    discordName: {
        type: mongoose.SchemaTypes.String,
        required: true,
    },
    lolName: {
        type: mongoose.SchemaTypes.String,
        required: true,
    },
    lolRank: {
        type: mongoose.SchemaTypes.String,
        required: true,
    },
    elo: {
        type: mongoose.SchemaTypes.BigInt,
        required: true,
    },
    games: {
        type: mongoose.SchemaTypes.BigInt,
        required: true,
    },
}, {
    timestamps: true
});
const User = module.exports = mongoose.model('users', UserSchema);

const {User} = require('../db/schemas');

async function getUsersService() {
    return User.find();
}

async function registerUserService(discordId, discordName, lolName, lolRank){
    const user = new User({
        discordId,
        discordName,
        lolName,
        lolRank,
        wins: 0,
        losses: 0
    });
    
    await user.save().then(()=>console.log(`New user registred: ${user.discordName}`)).catch((e)=>console.log(e));
}

module.exports = {
    registerUserService,
    getUsersService
}
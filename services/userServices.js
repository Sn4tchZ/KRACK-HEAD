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
        elo: 150,
        games: 0
    });
    await user.save().then(()=>console.log(`New user registred: ${user.discordName}`)).catch((e)=>console.log(e));
}

async function getUserElo(discordId){
    const user = await User.findOne({discordId: discordId}).exec();
    return user.elo;
}

async function addUserWinService(discordId){
    await User.findOneAndUpdate({discordId: discordId}, { $inc: { games: 1, elo: 18 } }).catch((err)=>console.log('error updating user', err));
}

async function addUserLossService(discordId){
    await User.findOneAndUpdate({discordId: discordId}, { $inc: { games: 1, elo: -17 }}).catch((err)=>console.log('error updating user', err));
}

async function usersLeaderboard(){
    const pipeline = [
        {
            $match: {
            $expr: { 
                    $gte: ['$games', 1] , // Filter users with wins + losses >= 10
                }
            }
        },
        {
            $project: {
            user: '$discordName',
            elo: '$elo',
            games: '$games'
            }
        },
        {
            $sort: { elo: -1 } // Sort by elo in descending order
        }
    ];

    await User.aggregate(pipeline)
        .exec().then((res)=>{
            console.log(res);
            result = res;
        }).catch((err)=>console.error(err));
    return result;
}

module.exports = {
    registerUserService,
    getUsersService,
    addUserWinService,
    addUserLossService,
    usersLeaderboard,
    getUserElo,
}
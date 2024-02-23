const {usersLeaderboard} = require('../services/userServices.js');
class Leaderboard {
    constructor(channel, id){
        this.channel = channel;
        this.id = id;
        this.embed = {};
        this.lastUpdate = null;
        this.leaderBoard = [];
        this.message = null;
        let now = new Date();
        this.nextUpd = Math.floor(new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1, // the next day, ...
            0, 0, 0 // ...at 00:00:00 hours
        ).getTime()/1000) ;
    }

    async init(){
        this.lastUpdate = Date.now();
        await this.getLeaderBoard();
        console.log(this.leaderBoard);
        await this.constructMessage();
        await this.channel.send({ embeds: [this.embed] }).then((msg)=>this.message = msg).catch((e)=>console.log(e));
        this.waitUntil();
    }

    async constructMessage(){
        const top = [];

        const participantsTxt = (tab, prefix) => tab.map((participant,key) =>
            "`" +  (key+prefix) + ".` `" + participant.user + "`"
        ); 

        const ratings = (tab) => tab.map((participant) =>
        "`" + participant.elo + "`" + " in `" + participant.games + " games`"
    ); 

        await this.leaderBoard.forEach((element,key) => {
            if(key<50) top.push(element);
        });



        this.embed = {
        "type": "rich",
        "title": `🏆 Leaderboard - TOP 50 Players🏆`,
        "description": "",
        "color": 0x2fff00,
        "fields": [
            {
                "name": `Next Update : <t:${this.nextUpd}:R>`,
                "value": "",
                "inline": false
            },
            {
            "name": "Ranking",
            "value": participantsTxt(top,1).join('\n'),
            "inline": true
            },
            {
            "name": "Elo",
            "value": ratings(top).join('\n'),
            "inline": true
            }
        ],
        "timestamp": ''+new Date().toISOString(),
        "footer": {
            "text": `LeaderBoard`
        }
        }
    }

    async updateMessage(){
        await this.getLeaderBoard();
        this.lastUpdate = Date.now();
        await this.constructMessage();
        await this.message.edit({ embeds: [this.embed] }).catch((e)=>console.log(e));
    }

    async getLeaderBoard(){
        this.leaderBoard = await usersLeaderboard();
    }

    waitUntil() {
        return new Promise(resolve => {
            const checkCondition = () => {
                let now = new Date();
                let night = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() + 1, // the next day, ...
                    0, 0, 0 // ...at 00:00:00 hours
                );
                let msToMidnight = night.getTime() - now.getTime();
                this.nextUpd = Math.floor(night.getTime()/1000);
                this.updateMessage();
                setTimeout(checkCondition, msToMidnight);
            };
            checkCondition();
        });
    }
}

module.exports = {Leaderboard}
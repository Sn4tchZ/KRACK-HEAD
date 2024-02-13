const interactionCreate = require("../events/interactionCreate");
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType, PermissionsBitField } = require('discord.js');
let {Lobbys, inQueue} = require('./lobbys.js');
const WebSocket = require('ws');

class Lobby {
    constructor(channel,id, categoryId){
        this.id = id;
        this.categoryId = categoryId;
        this.channel = channel;
        this.participants = [];
        this.teamBlue = [];
        this.teamRed = [];
        this.lobbyMsg = null;
        this.ready = [];
        this.inscriptionOpen = true;
        this.textChan = null;
        this.redVoc = null;
        this.blueVoc = null;
        this.blueRole = null;
        this.redRole = null;
        this.embed = () => {
            const participantsTxt = () => this.participants.map(participant =>
                `${!this.inscriptionOpen ? (this.ready.includes(participant) ? '✅' : '❌') : ''}<@${participant}>\n`
            );            
            return {
            color: 0x0099ff,
            title: this.participants.length == 10 ? 'Queue completed':'Queue looking for players',
            description: 'Join queue to play',
            fields: [
                {
                    name: 'Players',
                    value: ""+participantsTxt().join('\n'),
                }
            ],
            image: {
                url: 'https://i.ytimg.com/vi/bxaifGPhgr0/maxresdefault.jpg',
            },
            timestamp: new Date().toISOString(),
            footer: {
                text: `${this.id}`,
            },
        };};
    }

    async init(){
        const join = new ButtonBuilder()
			.setCustomId(`join_queue_${this.id}`)
			.setLabel('Join Queue')
			.setStyle(ButtonStyle.Success);

		const leave = new ButtonBuilder()
			.setCustomId(`leave_queue_${this.id}`)
			.setLabel('Leave Queue')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder()
			.addComponents(join, leave);

        this.channel.send({ embeds: [this.embed()], components: [row] }).then((msg)=>this.lobbyMsg = msg).catch((e)=>console.log(e));
    }

    async addPlayer(discordId) {
        if (this.inscriptionOpen && !inQueue.includes(discordId)) {
            if (this.participants.length < 10 && !this.participants.includes(discordId)) {
                this.participants.push(discordId);
                inQueue.push(discordId);
                if (this.participants.length === 10) {
                    this.inscriptionOpen = false;
                    let txt = ""; 
                    this.participants.map((elem)=> txt = txt + `<@${elem}> `);
                    this.channel.send("get ready "+txt).catch((e)=>console.log(e));
                }
            } else if (this.participants.length > 10) {
                this.inscriptionOpen = false;
                this.participants.splice(10); // Trim the array to the first 10 elements
            }
            await this.updateMsg();
        }
    }

    async removePlayer(discordId) {
        if (this.participants.includes(discordId)) {
            this.participants = this.participants.filter(value => value !== discordId);
            if (!this.inscriptionOpen && this.participants.length < 10) {
                this.inscriptionOpen = true;
            }
            inQueue = inQueue.filter(e => e !== discordId);
            await this.updateMsg();
        }
    }

    async readyPlayer(discordId) {
        if (!this.ready.includes(discordId) && this.participants.includes(discordId)) {
            this.ready.push(discordId);
            if (this.ready.length === this.participants.length) {
                await this.createGame().catch(((error) => console.log(error)));
                return;
            }
            this.updateMsg();
        }
    }    

    async updateMsg(){
        let row = null;
        const join = new ButtonBuilder()
			.setCustomId(`join_queue_${this.id}`)
			.setLabel('Join Queue')
			.setStyle(ButtonStyle.Success);

		const leave = new ButtonBuilder()
			.setCustomId(`leave_queue_${this.id}`)
			.setLabel('Leave Queue')
			.setStyle(ButtonStyle.Danger);

        const ready = new ButtonBuilder()
			.setCustomId(`ready_queue_${this.id}`)
			.setLabel('Ready')
			.setStyle(ButtonStyle.Success);
        

        if(this.inscriptionOpen){
            row = new ActionRowBuilder()
			.addComponents(join, leave);
        }else if(!this.inscriptionOpen){
            row = new ActionRowBuilder()
			.addComponents(ready);
        }

        await this.lobbyMsg.edit({ embeds: [this.embed()], components: [row] }).catch((e)=>console.log(e));
    }

    waitUntil(condition) {
        return new Promise(resolve => {
            const checkCondition = () => {
            if (condition()) {
                const newId = Date.now();
                Lobbys[newId] = new Lobby(this.channel,newId,this.categoryId);
                Lobbys[newId].init();
                resolve();
            } else {
                setTimeout(checkCondition, 60000);
            }
            };
            checkCondition();
        });
    }

    async createGame(){
        await this.participants.forEach((key,value)=>{
            if(value <5){
                this.teamRed.push(key);
            }else{
                this.teamBlue.push(key);
            }
        })

        await this.lobbyMsg.delete().catch((e)=>console.log(e));

        const cat = await this.channel.guild.channels.fetch(this.categoryId);

        const cond = ()=>{
            if(cat.children.cache.size>44){
                console.log('oui');
                return false;
            }else{
                return true;
            }
        }
        await this.channel.send('Checking lobbys availability, pls wait').catch((e)=>console.log(e));

        this.waitUntil(cond);

        await this.channel.guild.roles.create({
            name: `Blue - ${this.id}`
        }).then((role)=>this.blueRole= role).catch((err)=>console.log("error creating blue role",err));

        await this.channel.guild.roles.create({
            name: `Red - ${this.id}`
        }).then((role)=>this.redRole= role).catch((err)=>console.log("error creating red role",err));

        await this.teamBlue.forEach(async (value)=>{
            console.log(value);
            await this.channel.guild.members.addRole({user: value,role: this.blueRole.id, reason: ""}).catch((err)=>console.log("error adding role",err));
        })

        await this.teamRed.forEach(async (value)=>{
            console.log(value);
            await this.channel.guild.members.addRole({user: value,role: this.redRole.id, reason: ""}).catch((err)=>console.log("error adding role",err));
        })

        let redList = "red team : ";
        await this.teamRed.forEach((element)=> redList = redList + "<@"+element+"> ")

        let blueList = "blue team : ";
        await this.teamBlue.forEach((element)=>blueList = blueList + "<@"+element+"> ")

        await this.channel.guild.channels.create({
            name: `${this.id}`,
            type: ChannelType.GuildText,
            parent: this.categoryId,
            permissionOverwrites: [
                {
                    id: this.blueRole.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                },
                {
                    id: '1202052171462623272',
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                },
                {
                    id: this.redRole.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                },
                {
                    id: '1201861728447762442',
                    deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                },
            ],
        }).then((chan)=>this.textChan = chan).catch((err)=>console.log("error creating channel",err));
        await this.textChan.send(`game id: ${this.id}`).catch((err)=>console.log("error sending msg",err));
        await this.textChan.send(blueList).catch((err)=>console.log("error sending msg",err));
        await this.textChan.send(redList).catch((err)=>console.log("error sending msg",err));
        await this.getDraft(this.textChan).catch((e)=>console.log("error getting draft",e));

        await this.channel.guild.channels.create({
            name: `🔵 - ${this.id}`,
            type: ChannelType.GuildVoice,
            parent: this.categoryId,
            permissionOverwrites: [
                {
                    id: this.blueRole.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
                },
                {
                    id: '1202052171462623272',
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
                },
                {
                    id: this.redRole.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                    deny: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak]
                },
                {
                    id: '1201861728447762442',
                    deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                },
            ],
        }).then((chan)=>this.blueVoc = chan).catch((err)=>console.log("error creating blue channel",err));

        await this.channel.guild.channels.create({
            name: `🔴 - ${this.id}`,
            type: ChannelType.GuildVoice,
            parent: this.categoryId,
            permissionOverwrites: [
                {
                    id: this.redRole.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
                },
                {
                    id: '1202052171462623272',
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
                },
                {
                    id: this.blueRole.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                    deny: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak]
                },
                {
                    id: '1201861728447762442',
                    deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
                },
            ],
        }).then((chan)=>this.redVoc = chan).catch((err)=>console.log("error creating red channel",err));
}

    async stopGame(){
        if(this.ready.length < 10) return;
        
        await this.participants.forEach((elem)=>{
            inQueue = inQueue.filter((e)=>e!=elem)
        })
        await this.textChan.delete(); 
        await this.redVoc.delete();
        await this.blueVoc.delete();
        await this.blueRole.delete();
        await this.redRole.delete();
        let id = this.id
        Lobbys[id] = undefined;
    }

    async stopLobby(){
        if(this.ready.length == 10) return;
        await this.lobbyMsg.delete().catch((e)=>console.log(e));

        await this.participants.forEach((elem)=>{
            inQueue = inQueue.filter((e)=>e!=elem)
        })

        const newId = Date.now();
        Lobbys[newId] = await new Lobby(this.channel,newId,this.categoryId);
        await Lobbys[newId].init();
    }

    async getDraft(chan) {
        const websocket = new WebSocket('wss://draftlol.dawe.gg/');
    
        websocket.on('open', async () => {
            const data = {
                "type": "createroom",
                "blueName": "In-House Queue Blue",
                "redName": "In-House Queue Red",
                "disabledTurns": [],
                "disabledChamps": [],
                "timePerPick": "40",
                "timePerBan": "40"
            };
            let response = null;
    
            websocket.send(JSON.stringify(data));
    
            try {
                const result = await new Promise((resolve, reject) => {
                    websocket.once('message', resolve);
                    setTimeout(() => reject(new Error('Timeout')), 10000);
                });
    
                if (result) {
                    const data = await JSON.parse(result);
                    chan.send(':blue_circle: https://draftlol.dawe.gg/'+data.roomId+'/'+data.bluePassword+'\n:red_circle: https://draftlol.dawe.gg/'+data.roomId+'/'+data.redPassword+'\n**Spectators:** https://draftlol.dawe.gg/'+data.roomId);
                }
            } catch (error) {
                if (error.message !== 'Timeout') {
                    console.error(error);
                }
            } finally {
                websocket.close();
            }
            return ;
        });
    }

}

module.exports = {Lobby};
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

    init(){
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

    addPlayer(discordId) {
        if (this.inscriptionOpen && !inQueue.includes(discordId)) {
            if (this.participants.length < 10 && !this.participants.includes(discordId)) {
                this.participants.push(discordId);
                inQueue.push(discordId);
                if (this.participants.length === 10) {
                    this.inscriptionOpen = false;
                }
            } else if (this.participants.length > 10) {
                this.inscriptionOpen = false;
                this.participants.splice(10); // Trim the array to the first 10 elements
            }
            this.updateMsg();
        }
    }

    removePlayer(discordId) {
        if (this.participants.includes(discordId)) {
            this.participants = this.participants.filter(value => value !== discordId);
            if (!this.inscriptionOpen && this.participants.length < 10) {
                this.inscriptionOpen = true;
            }
            inQueue = inQueue.filter(e => e !== discordId);
            this.updateMsg();
        }
    }

    readyPlayer(discordId) {
        if (!this.ready.includes(discordId) && this.participants.includes(discordId)) {
            this.ready.push(discordId);
            if (this.ready.length === this.participants.length) {
                this.createGame().catch(((error) => console.log(error)));
                return;
            }
            this.updateMsg();
        }
    }    

    updateMsg(){
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

        this.lobbyMsg.edit({ embeds: [this.embed()], components: [row] }).catch((e)=>console.log(e));
    }

    waitUntil(condition) {
        return new Promise(resolve => {
            const checkCondition = async () => {
            if (condition()) {
                const newId = Date.now();
                Lobbys[newId] = await new Lobby(this.channel,newId,this.categoryId);
                await Lobbys[newId].init();
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

        this.waitUntil(cond);

        //const channels = await this.channel.guild.channels.fetch();
        //const filteredChans = await channels.filter((channel)=>channel.parentId == this.categoryId);
        //channels.forEach((chan)=>console.log(chan));
        //await console.log('chans',channels);
        try{

            await this.channel.guild.roles.create({
                name: `Blue - ${this.id}`
            }).then((role)=>this.blueRole= role);

            await this.channel.guild.roles.create({
                name: `Red - ${this.id}`
            }).then((role)=>this.redRole= role);

            await this.teamBlue.forEach((value)=>{
                console.log(value);
                this.channel.guild.members.addRole({user: value,role: this.blueRole.id, reason: ""});
            })

            await this.teamRed.forEach((value)=>{
                console.log(value);
                this.channel.guild.members.addRole({user: value,role: this.redRole.id, reason: ""});
            })

            let redList = "red team : ";
            this.teamRed.forEach((element)=> redList = redList + "<@"+element+"> ")

            let blueList = "blue team : ";
            this.teamBlue.forEach((element)=>blueList = blueList + "<@"+element+"> ")

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
                        id: this.redRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                    {
                        id: '1201861728447762442',
                        deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                ],
            }).then((chan)=>this.textChan = chan);
            await this.textChan.send(`game id: ${this.id}`);
            await this.textChan.send(blueList);
            await this.textChan.send(redList);
            await this.getDraft(this.textChan).catch((e)=>console.log(e));

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
                        id: this.redRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                        deny: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak]
                    },
                    {
                        id: '1201861728447762442',
                        deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                ],
            }).then((chan)=>this.blueVoc = chan);

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
                        id: this.blueRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                        deny: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak]
                    },
                    {
                        id: '1201861728447762442',
                        deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                ],
            }).then((chan)=>this.redVoc = chan);
        }catch{
            console.log('error');
            stopGame();
        }
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
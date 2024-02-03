const WebSocket = require('ws');

async function getDraft() {
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
                const data = JSON.parse(result);
                response =
                    `:blue_circle: https://draftlol.dawe.gg/${data.roomId}/${data.bluePassword}\n
                    :red_circle: https://draftlol.dawe.gg/${data.roomId}/${data.redPassword}\n
                    **Spectators:** https://draftlol.dawe.gg/${data.roomId}`;
            }
        } catch (error) {
            if (error.message !== 'Timeout') {
                console.error(error);
            }
        } finally {
            websocket.close();
        }
        console.log(response);
        return response;
    });
}

module.exports={getDraft};
const express = require("express");
const mongoose = require("mongoose");

const mqtt = require('mqtt')
const host = '193.133.195.176'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `mqtt://${host}:${port}`

const server = '193.133.195.176:27017';
const database = 'test';

const waterLevelSchema = new mongoose.Schema({
    date: String,
    value: String,
    id: Number,
});

// const soilSensorSchema = new mongoose.Schema({
//     date: new Date().toLocaleDateString('en-GB').toString(),
//     value: String,
//     id: Number,
// });

// const temperatureSensorSchema = new mongoose.Schema({
//     date: new Date().toLocaleDateString('en-GB').toString(),
//     temperature: String,
//     humidity: String,
//     id: Number,
// });

// const waterPumpSchema = new mongoose.Schema({
//     date: String,
//     id: Number,
// });

const Waterlevel = mongoose.model('WaterLevel', waterLevelSchema);


class Database {
    constructor() {
        this._connect();
        this._listenTo();
    }

    _connect() {
        mongoose
            .connect(`mongodb://user1:user1@193.133.195.176:27017/waterLevel?authSource=admin`)
            .then(() => {
                console.log('Database connection successful');



            })
            .catch((err) => {
                console.error('Database connection failed');
            });
    }

    _listenTo() {
        const client = mqtt.connect(connectUrl, {
            clientId,
            clean: true,
            connectTimeout: 4000,
            username: 'user1',
            password: 'user1',
            reconnectPeriod: 1000,
        })

        const topic = 'distance'

        client.on('connect', () => {
            console.log('Connected')

            client.subscribe([topic], () => {
                console.log(`Subscribe to topic '${topic}'`)
                client.publish(topic, 'nodejs mqtt test', { qos: 0, retain: false }, (error) => {
                    if (error) {
                        console.error(error)
                    }
                })
            })
        })

        client.on('message', (topic, payload) => {
            console.log(topic);
            console.log(payload);
            
            const waterLevelLog = new Waterlevel({
                date:new Date().toLocaleDateString('en-GB').toString(),
                value: payload.toString(),
                id: 1,
            });

            console.log('Received Message:', topic, payload.toString())
            waterLevelLog.save()
                .then(() => {
                    console.log('Water Level State saved at MongoDB');
                   // mongoose.disconnect();
                })
                .catch((error) => {
                    console.error(error);
                });
        })

    }

}

module.exports = new Database();
const app = express()
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(3000, () => {
    console.log(`Example app listening on port ${3000}`)
})

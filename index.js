const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

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
});

const soilMoistureSchema = new mongoose.Schema({
    date: String,
    value: String,
});

const waterPumpActivationSchema = new mongoose.Schema({
    date: String,
});

const Waterlevel = mongoose.model('WaterLevel', waterLevelSchema);
const SoilMoisture = mongoose.model('SoilMoisture', soilMoistureSchema);
const WaterPumpActivation = mongoose.model('WaterPumpActivation', waterPumpActivationSchema);

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
        });

        client.on('connect', () => {
            console.log('Connected');

            client.subscribe('distance');
            client.subscribe('moisture');
            client.subscribe('waterPumpActivation');
        });

        client.on('message', (topic, payload) => {
            console.log("Payload:" + payload);
      
            const currentDate = new Date();

            const waterLevelLog = new Waterlevel({
                date: currentDate,
                value: payload.toString(),
            });

            const soilMoistureLog = new SoilMoisture({
                date: currentDate,
                value: payload.toString(),
            });

            const waterPumpActivationLog = new WaterPumpActivation({
                date: currentDate,
                value: " Ativação da Bomba d'água",
            });

            switch (topic) {
                case 'distance':
                    waterLevelLog.save()
                        .then(() => console.log('Water Level State saved at MongoDB'))
                        .catch((error) => console.error(error));
                    break;
                case 'moisture':
                    soilMoistureLog.save()
                        .then(() => console.log('Soil Moisture State saved at MongoDB'))
                        .catch((error) => console.error(error));
                    break;
                case 'waterPumpActivation':
                    waterPumpActivationLog.save()
                        .then(() => console.log('Water Pump Activation Log saved at MongoDB'))
                        .catch((error) => console.error(error));
                    break;
            }
        });

        process.on('SIGINT', () => {
            mongoose.connection.close(() => {
                console.log('MongoDB disconnected through app termination');
                process.exit(0);
            });
        });
    }
}

module.exports = new Database();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ text: 'Hello World!' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.get('/average-water-level', async (req, res) => {
    try {
        const lastRecords = await Waterlevel.find().sort({ date: -1 }).limit(10);
        const average = calculateAverage(lastRecords.map(record => parseInt(record.value)));
        res.json({ average });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/average-soil-moisture', async (req, res) => {
    try {
        const lastRecords = await SoilMoisture.find().sort({ date: -1 }).limit(10);
        const average = calculateAverage(lastRecords.map(record => parseInt(record.value)));
        res.json({ average });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/last-water-pump-activations', async (req, res) => {
    try {
        const lastActivations = await WaterPumpActivation.find().sort({ date: -1 }).limit(10);
        res.json(lastActivations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function calculateAverage(array) {
    const sum = array.reduce((acc, value) => acc + value, 0);
    return sum / array.length;
}

app.listen(3000, () => {
    console.log(`Example app listening on port ${3000}`);
});

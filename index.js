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
    id: Number,
});

const soilMoistureSchema = new mongoose.Schema({
    date: String,
    value: String,
    id: Number,
});

const waterPumpActivationSchema = new mongoose.Schema({
    date: String,
    id: Number,
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
                date: new Date().toLocaleDateString('en-GB').toString(),
                value: payload.toString(),
                id: 1,
            });
            const soilMoistureLog = new SoilMoisture({

            })

            const waterPumpActivationLog = new WaterPumpActivation({

            })
            
            console.log('Received Message:', topic, payload.toString())
            // waterLevelLog.save()
            //     .then(() => {
            //         console.log('Water Level State saved at MongoDB');
            //        // mongoose.disconnect();
            //     })
            //     .catch((error) => {
            //         console.error(error);
            //     });
        })

      

        process.on('SIGINT', () => {
            mongoose.connection.close(() => {
                console.log('MongoDB disconnected through app termination');
                process.exit(0);
            });
        });
    }

}

module.exports = new Database();
const app = express()
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('{"text":"Hello World!"}')
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
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
        res.json({ lastActivations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Function to calculate average
function calculateAverage(array) {
    const sum = array.reduce((acc, value) => acc + value, 0);
    return sum / array.length;
}

app.listen(3000, () => {
    console.log(`Example app listening on port ${3000}`)
})

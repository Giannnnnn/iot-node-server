const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const mqtt = require('mqtt')

const host = '193.133.195.176'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
const connectUrl = `mqtt://${host}:${port}`

// Definindo os esquemas para os modelos de dados MongoDB
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

// Criando os modelos MongoDB
const Waterlevel = mongoose.model('WaterLevel', waterLevelSchema);
const SoilMoisture = mongoose.model('SoilMoisture', soilMoistureSchema);
const WaterPumpActivation = mongoose.model('WaterPumpActivation', waterPumpActivationSchema);

// Classe para gerenciar a conexão ao MongoDB e ouvir mensagens MQTT
class Database {
    constructor() {
        this._connect();
        this._listenTo();
    }

    // Método privado para conectar ao MongoDB
    _connect() {
        mongoose
            .connect(`mongodb://user1:user1@193.133.195.176:27017/waterLevel?authSource=admin`)
            .then(() => {
                console.log('Conexão com o banco de dados MongoDB bem-sucedida');
            })
            .catch((err) => {
                console.error('Falha na conexão com o banco de dados MongoDB');
            });
    }

    // Método privado para configurar a escuta de mensagens MQTT
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
            console.log('Conectado');

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
                        .then(() => console.log('Estado do Nível de Água salvo no MongoDB'))
                        .catch((error) => console.error(error));
                    break;
                case 'moisture':
                    soilMoistureLog.save()
                        .then(() => console.log('Estado da Umidade do Solo salvo no MongoDB'))
                        .catch((error) => console.error(error));
                    break;
                case 'waterPumpActivation':
                    waterPumpActivationLog.save()
                        .then(() => console.log('Log de Ativação da Bomba de Água salvo no MongoDB'))
                        .catch((error) => console.error(error));
                    break;
            }
        });

        process.on('SIGINT', () => {
            mongoose.connection.close(() => {
                console.log('MongoDB desconectado pela aplicação');
                process.exit(0);
            });
        });
    }
}

module.exports = new Database();

// CONFIGURAÇÃO E INICIALIZAÇÃO DO EXPRESS
const app = express();
app.use(cors());
app.use(express.json());
// ROTA PARA OBTER A MÉDIA DO NÍVEL DE ÁGUA
app.get('/average-water-level', async (req, res) => {
    try {
        const lastRecords = await Waterlevel.find().sort({ date: -1 }).limit(10);
        const average = calculateAverage(lastRecords.map(record => parseInt(record.value)));
        res.json({ average });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// ROTA PARA OBTER A MÉDIA DA UMIDADE DO SOLO
app.get('/average-soil-moisture', async (req, res) => {
    try {
        const lastRecords = await SoilMoisture.find().sort({ date: -1 }).limit(10);
        const average = calculateAverage(lastRecords.map(record => parseInt(record.value)));
        res.json({ average });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// ROTA PARA OBTER OS ÚLTIMOS REGISTROS DE ATIVAÇÃO DA BOMBA D'ÁGUA
app.get('/last-water-pump-activations', async (req, res) => {
    try {
        const lastActivations = await WaterPumpActivation.find().sort({ date: -1 }).limit(10);
        res.json(lastActivations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// Função para calcular a média de um array
function calculateAverage(array) {
    const sum = array.reduce((acc, value) => acc + value, 0);
    return sum / array.length;
}
// Inicia o servidor Express
app.listen(3000, () => {
    console.log(`Aplicação ouvindo na porta ${3000}`);
});

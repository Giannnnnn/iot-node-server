

export  const soilSensorSchema = new mongoose.Schema({
    date: new Date().toLocaleDateString('en-GB').toString(),
    value: String,
    id: Number,
});

export  const temperatureSensorSchema = new mongoose.Schema({
    date: new Date().toLocaleDateString('en-GB').toString(),
    temperature: String,
    humidity: String,
    id: Number,
});

export const waterPumpSchema = new mongoose.Schema({
    date: String,
    id: Number,
});

export const Waterlevel = mongoose.model('WaterLevel', waterLevelSchema);

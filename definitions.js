

export const host = '193.133.195.176'
export const port = '1883'
export const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
export const connectUrl = `mqtt://${host}:${port}`
export const server = '193.133.195.176:27017';
export const database = 'test';

export const waterLevelLog = new Waterlevel({
    date: "",
    value: "200",
    id: 1,
});

module.exports = new Database();
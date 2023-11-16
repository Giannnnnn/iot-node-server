const mqtt = require('mqtt')

const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'user1',
    password: 'user1',
    reconnectPeriod: 1000,
})

const express = require("express");
const mongoose = require("mongoose");

class Database {
    constructor() {
        this._connect();
    }

    _connect() {
        mongoose
            .connect(`mongodb://user1:user1@193.133.195.176:27017/waterLevel?authSource=admin`)
            .then(() => {
                console.log('Database connection successful');

                waterLevelLog.save()
                    .then(() => {
                        console.log('Water Level State saved at MongoDB');
                        mongoose.disconnect();
                    })
                    .catch((error) => {
                        console.error(error);
                    });

            })
            .catch((err) => {
                console.error('Database connection failed');
            });
    }
}
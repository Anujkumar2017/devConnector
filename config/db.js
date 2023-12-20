const mongoose = require('mongoose');
const config = require('config');

const connectDB = async () =>{
    // console.log(config.get('mongoURI'));
    try {
        await mongoose.connect(config.get('mongoURI'));
        console.log("Database connected ...");
    } catch (err) {
        console.log(err.message);
        //Exit process with failure
        process.exit(1);
    }
}

module.exports = connectDB;
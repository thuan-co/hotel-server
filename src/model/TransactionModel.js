const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Transaction = new Schema({
    username: String,
    hotel: String,
    room: Array,
    dateStart: Date,
    dateEnd: Date,
    price: Number,
    payment: String,
    status: String
})
module.exports = mongoose.model('Transaction', Transaction)
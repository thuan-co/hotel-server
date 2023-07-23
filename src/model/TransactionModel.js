const mongoose = require("mongoose")
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

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
Transaction.plugin(mongoosePaginate)
module.exports = mongoose.model('Transaction', Transaction)
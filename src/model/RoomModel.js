const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const Schema = mongoose.Schema
const Room = new Schema({
    title: String,
    price: Number,
    maxPeople: Number,
    desc: String,
    roomNumbers: Array
}, { timestamps: true })

Room.method("toJSON", function() {
    const { __v, _id, ...object } = this.toObject()
    object.id = _id
    return object
})

Room.plugin(mongoosePaginate)

module.exports = mongoose.model('Room', Room)
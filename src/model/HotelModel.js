const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Hotel = new Schema( {
    address: String,
    cheapestPrice: Number,
    city: String,
    distance: String,
    featured: Boolean,
    name: String,
    rating: Number,
    photos: Array,
    rooms: Array,
    title: String,
    type: String
} )

module.exports = mongoose.model("Hotel", Hotel)
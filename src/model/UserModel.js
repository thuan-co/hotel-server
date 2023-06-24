const mongoose = require('mongoose')
const Schema = mongoose.Schema
// const ObjectId = Schema.ObjectId

const User = new Schema({
    username: { type: String },
    password: { type: String, min: 8 },
    fullName: { type: String },
    phoneNumber: { type: String, min: 9 },
    email: { type: String },
    isAdmin: { type: Boolean }
})

module.exports = mongoose.model("User", User)
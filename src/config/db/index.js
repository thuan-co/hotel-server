const mongoose = require('mongoose')
const models  = require('../../model')
const DB_URL = 'mongodb://127.0.0.1/funix_booking?replicaSet=dbrs'
const options = {
    readPreference: 'secondary',
}

const createCollections = async (models) => {
    await Promise.all(
        models.map((model) => model.createCollection())
    )
}
;(async () => {
    try {
        await mongoose.connect(DB_URL, options)

        await createCollections(models)

        console.log("Connected to the database successfully ")
    } catch (e) {

        console.error("Failed to connect to the database!", e)
    }
})()
// async function connect() {
//     try {

//         await mongoose.connect('mongodb://127.0.0.1/funix_booking')
//     } catch(error) {
//         console.log("Error connect DB: ", error)
//     }
//     console.log("Connect successfully")

// }

// module.exports = { connect }
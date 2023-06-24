const express = require('express')
const cors = require('cors')
const app = express()
const route = require('./src/router')
// Test connect to DB
const db = require('./src/config/db')
// db.connect()

app.use(cors())
/**
 * Reading data in body request with content-type properties is url-encoded
 */
app.use(express.urlencoded({
    extended: true
}))
/**
 * parse requests with content-type application/json
 */
app.use(express.json())

route(app)

app.listen(5000)
const express = require('express')
const router = express.Router()
const clientController = require('../controller/ClientController')

router.post('/login', clientController.loginClient)
router.post('/register', clientController.registerClient)
router.get('/hotel/location', clientController.getHotelByLocation)
router.get('/hotel/category', clientController.getHotelByType)
router.get('/hotel/top-rating', clientController.getHotelTopRating)
router.get('/hotel/detail/:id', clientController.getHotelDetailById)
router.post('/room/available', clientController.getAvailableRooms)
router.post('/reservation', clientController.makeReservation)

module.exports = router
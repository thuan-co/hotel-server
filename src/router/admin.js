const express = require('express')
const router = express.Router()
const adminController = require('../controller/AdminController')

router.post('/add-hotel', adminController.createNewHotel)
router.post('/add-rooms', adminController.updateRoomForHotel)
router.get('/hotels', adminController.getHotels)
router.get('/hotel/:id', adminController.getRoomsHotelById)
router.get('/list-hotel', adminController.getListHotels)
router.get( '/list-room', adminController.getListRooms)
router.get('/hotel-name/room', adminController.getNameHotelByRoomId)
router.delete('/room/:id', adminController.deleteRoomById)
module.exports = router
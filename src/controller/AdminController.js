const  mongoose = require('mongoose')
const HotelDTO = require('../model/HotelModel')
const RoomDTO = require('../model/RoomModel')
class AdminController {

    /** [POST] /api/v1/admin/add-hotel
     * Adding new Hotel
     */
    createNewHotel( req, res, next ) {
        let hotelReq = req.body
        // console.log("Request body: ", hotelReq)
        // setTimeout(() => {

        //     res.status(200).json(
        //         {
        //         message: `Thêm khách sạn ${hotelReq.name} thành công`,
        //         hotelId: '6311a9c64a642f01423490bf',
        //         hotelName: hotelReq.name,
        //         rooms: []
        //     })
        // }, 2000)
        let listRoomId = []
        // console.log("Hotel request: ", hotelReq)
        // ==> Create Room documents
        // -> Gets list rooms
        let listRoom = hotelReq.rooms.map( value => {
            return { "title": value }
        })
        // console.log("List rooms: ", listRoom)
        // -> Saves list rooms
        RoomDTO.create(listRoom)
            .then( result => {
                result.forEach(element => {
                    listRoomId.push(element._id.valueOf())
                })
                hotelReq = {
                    ...hotelReq,
                    'rooms': [...listRoomId]
                } 
                // ==> Create Hotel documents
                HotelDTO.create(hotelReq)
                    .then( result => {

                        let index = 0
                        listRoom = listRoom.map(value => {
                            let tmp = {
                                ...value,
                                'id': listRoomId[index]
                            }
                            index++
                            return tmp
                        })
                        res.status(200).json(
                            {
                            message: `Thêm khách sạn ${result.name} thành công`,
                            hotelId: result._id.valueOf(),
                            rooms: listRoom,
                            hotelName: result.name
                        })
                        return
                    })
                    .catch( err => {
                        console.log("Error creates new hotel ", err)
                        res.status(400).send(`Error creates new hotel ${hotelReq.name}`)
                        return
                    })        
            })
            .catch( err => {
                console.log("Add rooms error: ", err)
                res.status(400).send(`Error creates new hotel ${hotelReq.name}`)
                next()
            })
    }

    /**
     * [POST] /api/v1/admin/add-rooms
     * Updating number rooms for hotel
     */
    updateRoomForHotel( req, res, next ) {
        let room = req.body
        // console.log(room);
        // Create new rooms
        if (room.id === '') {
            // 1. Create new room
            RoomDTO.create({
                title: room.title, 
                price: room.price,
                desc: room.desc,
                roomNumbers: room.roomNumbers,
                maxPeople: room.maxPeople,
            }).then( roomResult => {
                HotelDTO.findById(room.hotelId)
                    .then( hotelResult => {
                        let tmpRooms = hotelResult.rooms
                        tmpRooms.push(roomResult.id.valueOf())
                        hotelResult.rooms = tmpRooms
                        // 2. Update rooms field in hotel collection
                        hotelResult.save()
                            .then(() => {
                                res.json({
                                    message: "Created room success",
                                    error: false
                                })
                                next()
                            })
                    }).catch(err =>{
                        res.status(400).json({
                            message: err.message,
                            error: true
                        })
                        next()
                    })
            }).catch( err => {
                res.status(400).json({
                    message: err.message,
                    error: true
                })
                next()
            }).catch( error => {
                res.status(400).json({
                    message: err.message,
                    error: true
                })
                next()
            })
        }
        // Update rooms
        else {
            RoomDTO.findById(room.id)
                .then( roomResult => {
                    // NOTE: room number was existed before
                    roomResult.roomNumbers = room.roomNumbers
                    roomResult.price = room.price
                    roomResult.desc = room.desc
                    roomResult.maxPeople = room.maxPeople
                    roomResult.save()
                        .then( result => {
                            console.log("Updated Room ", result)
                            res.json({
                                message: "Updated success",
                                error: false
                            })
                            next()
                        })
                        .catch( error => {
                            res.status(400).json({
                                message: error.message,
                                error: true
                            })
                            next()
                        })
                })
                .catch( err => {
                    res.status(400).json({
                        message: err.message,
                        error: true
                    })
                    next()
                })
        }
    }

    /**
     * [GET] /api/v1/admin/hotels
     * Gets hotels
     * Response: { name: string, id: string }
     */
    getHotels( req, res, next ) {
        HotelDTO.find({})
            .then( results => {

                let listHotels = results.map(value => {
                    return {
                        name: value.name,
                        id: value.id
                    }
                })
                res.json(listHotels)
            })
            .catch( err => res.status(400).send(err.message))
    }

    /**
     * [GET] /api/v1/admin/hotel/:id
     * Gets hotel by Id
     * Response {[{roomId: "", title: ""}]}
     */
    async getRoomsHotelById( req, res, next ) {
        let hotelId = req.params.id
        let roomsPromise
        let roomsRes = []
        let hotel
        try {
            hotel = await HotelDTO.findById(hotelId)
            roomsPromise = hotel.rooms.map( async value => {
                return RoomDTO.findById(value)
            })
            Promise.all(roomsPromise)
                .then( result => {

                    result.forEach(value => {
                        roomsRes.push({id: value.id.valueOf(), title: value.title})
                    })
                    res.json(roomsRes)
                })
                .catch( error =>  new Error(error.message)) 
        } catch(err) {
            res.status(400).send(err.message)
        }
    }

    /**
     * [GET] /api/v1/admin/list-hotel
     * Response {id: string, name: string, type: string, city: string}
     */
    getListHotels( req, res, next ) {
        
        HotelDTO.find()
            .then( listHotels => {
                const responseHotels = listHotels.map( value => {
                    return { 
                    id: value.id.valueOf(),
                    name: value.name,
                    type: value.type,
                    city: value.city
                }})
                res.json(responseHotels)
                next()
            })
            .catch( err => {
                res.status(401).send(err.message)
                next()
            })
    }

    /**
     * [GET] /api/v1/admin/list-room
     * Gets all rooms along to system
     * Response {id: string, title: string, desc: string, price: string, maxPeople: number}
     */
    getListRooms( req, res, next ) {
        let limit = req.query.limit
        let page = parseInt(req.query.page)
        // console.log('page', page)
        RoomDTO.paginate({}, { page: page + 1, limit: limit })
            .then( results => {
                res.json(results)
                next()
            })
            .catch( error => {
                res.status(401).json(error.message)
                next()
            })
    }

    /**
     * [GET] /hotel-name/room?id={}
     * Get name hotel by room id
     * Response {name: string}
     */
    getNameHotelByRoomId( req, res, next ) {

        const roomId = req.query.id
        HotelDTO.findOne({ rooms: roomId })
            .then(result => {
                res.json({name: result.name})
                next()
            })
            .catch(err => {
                res.status(401).json(err)
                next()
            })
    }
    static fakeFailTransaction = async () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject("Faking fail transaction")
            }, 2000)
        })
    }
    /**
     * [DELETE] /room/:id
     */
    async deleteRoomById( req, res, next ) {
        const id = req.params.id
        const session = await mongoose.startSession()

        session.startTransaction()

        try{
            await RoomDTO.findByIdAndDelete(id, { session })
            console.log("Delete result: ")
            await AdminController.fakeFailTransaction()
            
            // Commit the changes
            await session.commitTransaction()
            
            res.send(`hello world ${id}`)
        } catch( error ){
            // Rollback any changes made in the database
            await session.abortTransaction()

            // logging the error
            console.error(error)
            res.status(401).json(error)
        } finally {
            // Ending the session
            session.endSession()
        }
    }
}

module.exports = new AdminController
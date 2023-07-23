const  mongoose = require('mongoose')
const HotelDTO = require('../model/HotelModel')
const RoomDTO = require('../model/RoomModel')
const TransactionModel = require('../model/TransactionModel')
const { format, subDays } = require('date-fns')
const UserModel = require('../model/UserModel')
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
     * Updating number rooms for hotel, feature creating hotel
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
                            // console.log("Updated Room ", result)
                            res.json({
                                message: "Updated success " + roomResult.title,
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
     * [GET] /api/v1/admin/get/hotel/:id
     */
    async getHotelByIdHotel( req, res, next ) {
        const id = req.params.id
        // console.log(id)
        try {
            const result = await HotelDTO.findById(id)
            res.json(result)
        } catch (error) {
            res.status(501).send(error.message)
        }
        next()
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
     * [POST] /api/v1/admin/update-hotel
     * Update hotel
     */
    async updateHotel( req, res, next ) {
        const updatedHotel = req.body
        // console.log("Updated Hotel: ", updatedHotel)
        try {
            await HotelDTO.findByIdAndUpdate( updatedHotel.id, {
                name: updatedHotel.name,
                address: updatedHotel.address,
                city: updatedHotel.city,
                type: updatedHotel.type,
                cheapestPrice: Number(updatedHotel.price),
                photos: updatedHotel.photos,
                desc: updatedHotel.desc
            })
            const result = await HotelDTO.findById(updatedHotel.id)
            // console.log("Hotel: ", result)
            res.json({
                id: result._id.valueOf(),
                name: result.name,
                type: result.type,
                city: result.city
            })
        } catch(error) {
            console.log(error)
            res.status(501).json(error.message)
        }
        next()
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

    /**
     * 
     * [DELETE] /api/v1/admin/hotel/:id
     * Send request deleting hotel by ID and checks
     */
    async deleteHotelById( req, res, next ) {
        const hotelId = req.params.id
        // Check-in hotel was existed before
        const fakeDate = subDays(new Date(), 4)
        // console.log(fakeDate)
        try {
            const result = await TransactionModel.find({
                hotel: hotelId,
                status: { $in: ["Booked", "Checkin"] },
                dateEnd: { $gte: fakeDate }
            })

            if (result.length > 0) {
                res.json({
                    accept: false,
                    message: "Khách sạn đang có giao dịch (đặt)."
                })
            } else {
                res.json({
                    accept: true,
                    message: "Được phép xóa khách sạn"
                })
            }
        } catch(err) {
            console.log(err)
            res.status(501).json({
                error: true,
                message: err
            })
        }
        next()
    }
    /**
     * [POST] /api/v1/admin/confirm-delete-hotel/:id
     * 
     */
    async confirmDeleteHotelById( req, res, next ) {
        const id = req.params.id
        
        try {
            await TransactionModel.deleteMany({ hotel: id })
            const hotel = await HotelDTO.findById(id)
            const nRoom = hotel.rooms.length
            for (let i = 0; i < nRoom; i++) {
                const roomDeleted = await RoomDTO.deleteOne({ _id: hotel.rooms[i] } )
                console.log(roomDeleted)
            }      
            const result = await HotelDTO.deleteOne({ _id: id })
            console.log("Hotel deleted, ", result)
            res.json({
                message: "Deleted hotel success",
                error: false
            })
            // res.status(501).json({
            //     error: true,
            //     message: "Test loi"
            // })
        } catch (error) {
            res.status(501).json({
                error: true,
                message: error
            })
        }
        // res.send(id)
        next()
    }
    /**
     * Fake: fail a transaction
     */
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
        // const session = await mongoose.startSession()

        // session.startTransaction()

        try{
            // Finding hotel contain room id
            const hotel = await HotelDTO.findOne({rooms: id})
            const room = await RoomDTO.findById(id)
            const fakeDate = subDays(new Date(), 15)
            // gets transactions of hotel (room want delete)
            const roomNumbers = []
            const result = await TransactionModel.find({
                hotel: hotel._id.valueOf(),
                status: { $in: ["Booked", "Checkin"] },
                dateEnd: { $gte: new Date() }
            })

            if ( result.length > 0 ) {
                for (let i = 0; i < result.length; i++) {
                    roomNumbers.push(...result[i].room)
                }
                // console.log(room.roomNumbers)
                // console.log(roomNumbers)
                // Check room number is booking in transaction
                let isContain
                for (let i = 0; i < room.roomNumbers.length; i++) {
                    isContain = roomNumbers.indexOf(room.roomNumbers[i])
                    if (isContain >= 0) break
                }
                // Not allow deleting
                if (isContain >= 0) {
                    res.status(501).send('Deleting room not allow')
                    return next()
                } else {
                    // Allow deleting
                    const resDeleteRoom = await RoomDTO.findByIdAndDelete(id)
                    if ( resDeleteRoom ) {

                        res.status(200).send('Deleting room success')
                        return next()
                    }
                }

            } else {
                // Allow deleting
                const resDeleteRoom = await RoomDTO.findByIdAndDelete(id)
                if ( resDeleteRoom ) {
                    
                    res.status(200).send('Deleting room success')
                    return next()
                }
            }
            
            // console.log(hotel);
            // Deleting for hotel collection
            // const newRooms = hotel.rooms.filter( item => item !== id )
            // Update room for hotel collection
            // await hotel.updateOne({ rooms: [...newRooms] }, {session})
            // Delete document for room collection
            // await RoomDTO.findByIdAndDelete(id, { session })
            // await AdminController.fakeFailTransaction()
            // Commit the changes
            // await session.commitTransaction() 
            // res.status(200).send('Deleting room success')
            // next()
        } catch( error ){
            // Rollback any changes made in the database
            // await session.abortTransaction()
            // logging the error
            console.error(error)
            res.status(401).json(error)
            return next()
        } 
        // finally {
        //     // Ending the session
        //     // session.endSession()
        // }
    }

    /**
     * Get transactions booking
     * [GET] /transaction
     * 
     */
    async getTransactions( req, res, next ) {
        const limit = req.query.limit
        let result = []
        if (limit) {
            // console.log("Limit: ", Number(limit))
            try {
                result = await TransactionModel.find()
                        .sort({_id: -1}).limit(Number(limit))
                
            } catch( error) {
                    console.log(error)
                    res.json({
                        message: error,
                        error: true
                    })
                    return next()
            }
        } else {
            try {
                //TODO: Pagination for result, using library
                result = await TransactionModel.find()
                // console.log(result)

            } catch(error) {
                console.log(error)
                    res.json({
                        message: error,
                        error: true
                    })
                    return next()
            }
        }
        // console.log("List transaction: ", listTransaction)
        result = result.map(item => {
            return {
                id: item._id.valueOf(),
                username: item.username.split('@')[0],
                hotel: item.hotel,
                room: item.room.join(', '),
                date: format(item.dateStart, 'dd/MM/yyyy') 
                + ' - ' + 
                format(item.dateEnd, 'dd/MM/yyyy'),
                price: item.price,
                payment: item.payment,
                status: item.status
            }
        })

        let n = result.length
        for (let i = 0; i < n; i++) {
            let tmp = result[i]
            const hotel = await HotelDTO.findById(tmp.hotel)

            result[i].hotel = hotel.name
        }
        res.json(result)
    }

    getTotalUser( req, res, next ) {
        UserModel.find({ isAdmin: false })
            .then(result => {
                res.json({totalUser: result.length })
                return next()
            })
            .catch(err => {
                res.status(501).json({
                    message: err,
                    error: true 
                })
            })
    }

    getTotalTransaction( req, res, next ) {
        
        TransactionModel.count()
            .then(result => {
                res.json({ totalUser: result.length })
                return next()
            })
            .catch(err => {
                res.status(501).json({
                    message: err,
                    error: true 
                })
                return next()
            })
    }

    async getEarning( req, res, next ) {

        // Calculator total earning money
        try {
            //
            const listTransaction = await TransactionModel.find()
            const n = listTransaction.length
            let total = 0
            for (let i = 0; i < n; i++) {

                total += Number(listTransaction[i].price)
            }

            res.json({ 
                total: total,
                order: n
            })
            return next()
        } catch( error) {
            res.status(501).json({
                message: err,
                error: true 
            })
            return next()
        }
    }
}

module.exports = new AdminController
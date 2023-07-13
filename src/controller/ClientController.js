const UserDB= require("../model/UserModel")
const HotelDto = require("../model/HotelModel")
const RoomDto = require("../model/RoomModel")
const TransactionDto = require('../model/TransactionModel')
const format = require('date-fns/format')
const { default: mongoose } = require("mongoose")

class ClientController {
    /**
     * [POST] api/v1/login
     */
    loginClient( req, res, next ) {
        const username = req.body.username
        const password = req.body.password

        console.log(`Username: ${username} password: ${password}`)

        UserDB.findOne({ 
            username: username,
            password: password,
            isAdmin: false
        })
            .then( user => {
                // console.log(user)
                if ( user ) {
                    // res.send("Dang nhap thanh cong")
                    res.status(200).json( {
                        username: user.username,
                        fullName: user.fullName,
                        phoneNumber: user.phoneNumber,
                        email: user.email
                    } )
                    return
                } else {
                    res.status(401).json( {message:"Tài khoản hoặc mật khẩu không chính xác!"} )
                    return
                }
            })
            .catch( next )

        // res.send("Hello world")
    }

    /**
     * [POST] api/v1/register
     */
    registerClient( req, res, next ) {
        const username = req.body.username
        const password = req.body.password

        // ==> Checking existed yet ?
        UserDB.findOne({username: username})
            .then((user) => {
                if ( user !== null ) {
                    res.json({
                        message: `Tài khoản ${user.username} đã tồn tại.`,
                        redirect: "/register",
                        isAuth: false
                    })
                    return
                } else {
                    // ==> Create new user
                    const newUser = new UserDB( {username: username, password: password, isAdmin: false} )
                    newUser.save()
                        .then((user) => {
                            // console.log("New user: ", user )
                            if ( user ) {
                                res.json({
                                    message: `Tài khoản ${user.username} tạo thành công`,
                                    redirect: "/login",
                                    isAuth: true
                                })
                                return
                            }
                        })
                        .catch( next )
                }
            })
            .catch( next )
    }

    /**
     * [GET] api/v1/hotel/location?city
     */
    getHotelByLocation( req, res, next ) {
        let city = req.query.city
        // console.log("City: ", city)
        HotelDto.find({})
            .then( response => {

                if ( response !== null ) {
                    let hotelsResult = response.filter( item => {

                        return item.city.toLowerCase()
                            .includes(city.toLowerCase())
                    })
                    // console.log( hotelsResult.length )
                    res.json( hotelsResult.length )
                    next()
                }
            })
            .catch( err => {
                res.status(404).json({message: err.message})
                next()
            })
        // res.send("Hello world")
    }

    /**
     * [GET] api/v1/hotel/category?type
     */
    getHotelByType( req, res, next ) {
        let type = req.query.type
        type = type.toLowerCase()
        console.log("Type: ", type)
        HotelDto.find({ type: type })
            .then( response => {
                // console.log("Result finds: ", response)
                res.json( response.length )
                next()
                
            })
            .catch( error => {

                res.status(404).json({message: error.message})
                next()
            })
    }
    /**
     * [GET] api/v1/hotel/top-rating
     * Get top 3 hotel rating
     */
    getHotelTopRating( req, res, next ) {

        HotelDto.find({})
            .then( result => {

                // sorting hotel array by rating in descending order
                result.sort( (x, y) => {
                    return ( x.rating - y.rating ) * (-1)
                })
                setTimeout(() => {

                    let hotelTopRating = []
                    for (let _i = 0; _i < 3; _i++) {
                        // hotelTopRating.push(result[_i])
                        hotelTopRating.push({
                            _id: result[_i]._id,
                            city: result[_i].city,
                            cheapestPrice: result[_i].cheapestPrice,
                            name: result[_i].name,
                            img: result[_i].photos[0]
                        })
                    }
                    res.json(hotelTopRating)
                }, 2000)
            })
            .catch( err => {
                res.status(404).json( {message: err.message})
            })
    }

    /**
     * [GET] api/v1/hotel/detail/:id
     */
    getHotelDetailById( req, res, next ) {
        let _id = req.params.id
        // console.log("ID:", _id)
        HotelDto.findById(_id)
            .then( result => {
                res.json(result)
                next()
            })
            .catch( error => {
                res.status(404).json(error.message)
            })
        // res.send("Hello world")
    }

    /**
     * Gets all rooms of type, now available
     * @param {String[]} roomsType list type room
     * @param {String[]} rooms  list room unavailable
     */
    static async #getRoomsAvailable( roomsType, rooms ) {
        
        const n = roomsType.length
        const roomsAvail = []
        // console.log("Room Unavailable: ", rooms)
        for ( let _i = 0; _i < n; _i++ ) {
            // => get room doc
            try {
                const res = await RoomDto.findById(roomsType[_i])
                // console.log("Room numbers: ", res.roomNumbers )
                let roomAvailableTmp = res.roomNumbers.filter( item => rooms.includes(JSON.stringify(item)) === false)
                // console.log("Rooms Available: ", roomAvailableTmp )

                    roomsAvail.push({
                        id: roomsType[_i],
                        title: res.title,
                        desc: res.desc,
                        price: res.price,
                        maxPeople: res.maxPeople,
                        roomNumbers: roomAvailableTmp
                    })
                
            } catch (error) {
                console.log("Error rooms available ", error)
                return [null, error.message]
            }
        }
        return [ roomsAvail, null ]
    }

    /**
     * Get transaction has status booked or check-in, in dateEnd to dateStart
     * @param {*} hotelId 
     * @param {*} dateEnd 
     * @param {*} dateStart 
     * @returns 
     */
    static async #getTransactions( hotelId, dateEnd, dateStart ) {

        try {

            const res = await TransactionDto.find({
                hotel: hotelId,
                status:{ $in: ['Booked', 'Checkin'] },
                $or: [
                    { dateStart: { $lte: dateEnd } },
                    { dateEnd: { $gte: dateStart} },
                ]
            })
            return [res, null]
        } catch( err ) {
            console.log("Error get transaction: ", err)
            return [ null, err.message ]
        }
    }

    /**
     * Gets all types of room
     * @param {*} hotelId 
     */
    static async #getTypeRoomsByHotelId( hotelId ) {

        try {
            const res = await HotelDto.findById(hotelId)
            
            return [ res.rooms, null]
        } catch (error) {
            console.log(error);
            return [ null, error.message ]
        }
    }

    /**
     * [GET] api/v1/room/available?hotelId
     * Get rooms available of hotel to booking
     */
    async getAvailableRooms( req, res, next ) {
        const body = req.body
        try {

            const [ transactionRooms, error ] = await ClientController.#getTransactions(body.hotelId, body.endDate, body.startDate)

            if ( transactionRooms ) {
                console.log("=============")
                // console.log("Room transaction: ", transactionRooms)
                const roomUnAvailable = []
                for (let i = 0; i < transactionRooms.length; i++) {
                    const tmp = transactionRooms[i].room
                    roomUnAvailable.push(...tmp)
                }
                // console.log("Room Unavailable: ", roomUnAvailable)
                // ==> gets list room type by hotel_id
                const [ roomsType, errorType ] = await ClientController.#getTypeRoomsByHotelId(body.hotelId)
                if ( errorType ) {
                    throw new Error("Error when finding room type - ", errorType)
                }
                // => gets list room available to booking
                const [ roomAvail, errorAvail ] = await ClientController.#getRoomsAvailable(roomsType, roomUnAvailable)
                if ( errorAvail ) {
                    throw new Error("Error when finding room available - ", errorAvail)
                }
                res.json(roomAvail)
                next()
            } else {
                throw new Error(error)
            }
        } catch(err) {
            console.log(err);
            res.status(401).send(err.message)
            next()
        }
    }

    /**
     * [POST] api/v1/reservation
     * Request Body: {
     *  hotelId: string,
     *  rooms: {id: string, roomNumbers: []},
     *  startDate: string,
     *  endDate: string,
     * }
     * Makes transaction booking room
     */
    makeReservation( req, res, next ){
        const body = req.body
        // console.log("Body: ", body)
        console.log("Start date", new Date(body.startDate))
        // const startDate = new Date(body.startDate)
        // const endDate = new Date(body.endDate)
        // ==> Making reservation rooms
        const booked = new TransactionDto({
            username: body.username, 
            hotel: body.hotelId, 
            room: body.rooms,
            payment: body.payment,
            status: "Booked",
            price: body.price,
            dateStart: body.startDate,
            dateEnd: body.endDate
        })

        booked.save()
            .then( result => {
                // success 
                res.json(result)
                next()
            })
            .catch(err => {
                res.status(401).send(err.message)
                next()
            })
        console.log("Booked: ", booked)

    }

    /**
     * Gets all reservation by username/email
     * [GET] api/v1/reservations?username=
     */
    async getReservationByEmail( req, res, next ) {

        const username = req.query.username

        try {
            // console.log("Finding transactions")
            const result = await TransactionDto.find({ username: username })

            const reservationRes = []
            for (let i = 0; i < result.length; i++) {
                const item = result[i]
                const hotel = await HotelDto.findById(item.hotel)
                // console.log(hotel.name)
                reservationRes.push({
                    id: item.id.valueOf(),
                    hotelName: hotel.name,
                    room: item.room.join(', '),
                    date: format(item.dateStart, 'yyyy-MM-dd') + ' - ' + format(item.dateEnd, 'yyyy-MM-dd'),
                    price: item.price,
                    payment: item.payment,
                    status: item.status
                })
            }
            // console.log(reservationRes)
            res.json(reservationRes)
        } catch(error) {
            res.status(401).send(error.message)
            next()
        }
    }

    static async #filterHotelByCityAndMaxPeople(city, maxPeople) {

        const regex = new RegExp(city, 'i')

        try {
            const hotels = await HotelDto.find({ city: { $regex:  regex } })
            const result = []
            // console.log("Hotel: ", hotels)
            
            let nHotel = hotels.length
            for (let i = 0; i < nHotel; i++) {
                let item = hotels[i]
                let tmp = { 
                    hotelId: item.id.valueOf(), 
                    rooms: []
                }
                // Get list rooms
                let nRoom = item.rooms.length
                for (let j = 0; j < nRoom; j++) {
                    let roomId = item.rooms[j]
                    try {
                        const room = await RoomDto.findById(roomId)
                        if ( room ) {
                            // console.log(room)
                            if (room.maxPeople >= maxPeople) {
                                // push room
                                if (room.roomNumbers.length > 0) {
                                    tmp.rooms.push(room.roomNumbers)
                                }
                            }
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }
                if (tmp.rooms.length > 0) {
                    result.push(tmp)
                }
            }

            return [ result, null ]
        } catch(error) {
            console.log(error)
            return [ null, error ]
        }
    }
    /**
     * [GET] api/vi/search/hotel?location=
     */
    async searchHotels(req, res, next) {

        const location = req.query.location
        const maxPeople = Number(req.query.maxPeople)
        const startDate = req.query.startDate
        const endDate = req.query.endDate
        const aMountRoom = Number(req.query.rooms) /// so luong phong (number)
        const resultHotelId = []
        const response = []
        const [listHotel, err] = await ClientController
                .#filterHotelByCityAndMaxPeople(location, maxPeople)
        if (listHotel.length > 0) {
            
            let nHotel = listHotel.length
            for (let i = 0; i < nHotel; i++) {
                let item = listHotel[i]
                //Gets transaction by hotelId
                const [ transactionRooms, error ] = await ClientController
                        .#getTransactions(item.hotelId, endDate, startDate)
                // Gets list room un-available of a hotel
                const roomUnAvailable = []
                for (let i = 0; i < transactionRooms.length; i++) {
                    const tmp = transactionRooms[i].room
                    roomUnAvailable.push(...tmp)
                }
                // console.log("Rooms unavailable: ", roomUnAvailable)
                // Check/compare one by one (rooms was filter by max people and location)
                let count = 0
                for (let j = 0; j < item.rooms.length; j++) {
                    let roomItem = item.rooms[j]
                    if ( !roomUnAvailable.includes(roomItem )) {
                        count++
                    }
                    if (count >= aMountRoom) {
                        resultHotelId.push(item.hotelId)
                        break
                    }
                }
            }
            // Generate data return/response for client
            if (resultHotelId.length > 0) {
                for (let i = 0; i < resultHotelId.length; i++) {

                    try {
                        const tmp = await HotelDto.findById(resultHotelId[i])
                        response.push(tmp)
                    } catch (error) {
                        console.log(error)
                    }
                }
            }
            res.json(response)
            next()
            return
        }
        res.send("Khong co")
    }
}

module.exports = new ClientController
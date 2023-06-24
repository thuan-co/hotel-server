const UserDB= require("../model/UserModel")
const HotelDto = require("../model/HotelModel")

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
}

module.exports = new ClientController
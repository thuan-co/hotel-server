const UserDto = require('../model/UserModel')

class AuthAdmin {

    /**
     * Authentication Admin login system
     * [POST] /api/v1/admin/login
     */
    async loginAdmin( req, res, next ) {
        const account = req.body
        try {
            const result = await UserDto.findOne({
                isAdmin: true,
                email: account.email
            })
            if (result) {
                // Compare password
                if (result.password === account.password) {
    
                    res.json({
                        email: result.email,
                        name: result.fullName
                    })
                    next()
                } else {
                    res.status(401).send("Email or Password error!")
                    next()
                }
            } else {
                res.status(401).send("Email or Password error!")
                next()
            }
        } catch (error) {
            console.log(error)
            res.sendStatus(501)
            next()
        }
    }
}
module.exports = new AuthAdmin
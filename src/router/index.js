const routerClient = require('./client')
const routerAdmin = require('./admin')
/**
 * Setup routes for web-app
 * @param {Express} app 
 */
function route( app ) {
    /**
     * Router for Administrator
     */
    app.use( '/api/v1/admin', routerAdmin )
    /**
     * Router for User
     */
    app.use( '/api/v1', routerClient )
}

module.exports = route
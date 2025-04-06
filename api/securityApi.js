const exp = require('express')
const securityApp = exp.Router()
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')


let securityCollection

securityApp.use((req, res, next) => {
    securityCollection = req.app.get('securityCollection')
    next()
})

function remove(obj, st) {
    let keys = Object.keys(obj)
    keys = keys.filter(obj => obj != st)
    let newObj = {}
    keys.map((key) => {

        newObj[key] = obj[key]
    })

    return newObj
}

securityApp.use(exp.json())



securityApp.post('/login', async (req, res) => {
    let userObj = req.body
    let resObj = await securityCollection.findOne({ email: userObj.email })
    if (resObj == null) {
        res.send({
            message: 'Invalid email'
        })
    }
    else {
        let hashObj = await bcryptjs.compare(userObj.password, resObj.password)
        if (hashObj) {
            let signedToken = jwt.sign({ email: userObj.email}, process.env.SECRET_KEY, { expiresIn: '1d'})
            res.send({
                message: 'Login successful',
                token: signedToken,
                payload: resObj
            })
        }
        else {
            res.send({
                message: 'Invalid password'
            })
        }
    }
})


module.exports = securityApp
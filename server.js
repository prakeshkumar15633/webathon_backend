const exp=require('express')
const app=exp()
require('dotenv').config()
const mongoClient=require('mongodb').MongoClient
const path=require('path')
const { config } = require('dotenv')
const cors = require('cors');
app.use(cors());

// app.use(exp.static(path.join(__dirname,'../frontend/build')))
app.use(exp.json())

mongoClient.connect(process.env.DB_URL)
.then((client)=>{
    const db=client.db(process.env.DB_NAME)

    const usersCollection=db.collection('usersCollection')
    const adminCollection=db.collection('adminCollection')
    const securityCollection=db.collection('securityCollection');
    const roomCollection=db.collection('roomCollection');
    const attCollection =db.collection('attCollection');
    

    app.set('usersCollection',usersCollection)
    app.set('adminCollection',adminCollection)
    app.set('securityCollection',securityCollection);
    app.set('roomCollection',roomCollection);
    app.set('attCollection',attCollection);
    app.set('mainCollection', db.collection('mainCollection'));

    console.log('DB Connection success')
})
.catch((err)=>console.log('Error in db connection',err))

const userApp=require('./api/userApi')
const adminApp=require('./api/adminApi')
const securityApp=require('./api/securityApi')
const roomsApp=require('./api/roomsApi');
const attendanceApp = require('./api/attendanceApi');
const leaveApp = require('./api/leaveRequestApi');

app.use('/user-api',userApp)
app.use('/admin-api',adminApp)
app.use('/security-api',securityApp)
app.use('/rooms-api',roomsApp);
app.use('/attendance-api', attendanceApp);
app.use('/leave-api', leaveApp);

// app.use((req,res,next)=>{
//     res.sendFile(path.join(__dirname,'../frontend/build/index.html'))
// })

app.use((err,req,res,next)=>{
    res.send({
        err:err.message
    }) 
})

app.listen(4000,()=>console.log("Server running on port 4000..."))

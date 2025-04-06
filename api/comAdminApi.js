const exp = require('express')
const comAdminApp = exp.Router()
const bcryptjs = require('bcryptjs')

let usersCollection
let comAdminCollection
let adminCollection

comAdminApp.use((req, res, next) => {
    usersCollection = req.app.get('usersCollection')
    comAdminCollection = req.app.get('comAdminCollection')
    adminCollection = req.app.get('adminCollection')
    next()
})

comAdminApp.use(exp.json())

comAdminApp.post('/community', async (req, res) => {
    let comObj = req.body
    let resObj = await comAdminCollection.findOne({ id: comObj.id })
    if (resObj == null) {
        let resObj2 = await usersCollection.findOne({ username: comObj.admins[0].username })
        if (resObj2 != null) {
            let hashedPasswordResident = await bcryptjs.hash(comObj.passwordResident, 6)
            comObj.passwordResident = hashedPasswordResident
            let hashedPasswordSecurity = await bcryptjs.hash(comObj.passwordSecurity, 6)
            comObj.passwordSecurity = hashedPasswordSecurity
            let guidelinesArr = comObj.guidelines.split('$')
            comObj.guidelines = guidelinesArr
            let resObj3 = await comAdminCollection.insertOne(comObj)
            if (resObj3 != null) {
                let resObj4 = await usersCollection.updateOne({ username: comObj.admins[0].username }, { $addToSet: { community: comObj.id } })
                res.send({
                    message: 'Community created'
                })
            }
            else {
                res.send({
                    message: 'Insert failed'
                })
            }
        }
        else {
            res.send({
                message: 'User does not exist'
            })
        }
    }
    else {
        res.send({
            message: 'Community already exists'
        })
    }
});

// comAdminApp.get('/get-community/:id', async (req, res) => {
//     let id = req.params.id
//     let resObj = await comAdminCollection.findOne({ id: id })
//     if (resObj != null) {
//         res.send({
//             message: 'Community',
//             payload: resObj
//         })
//     }
//     else {
//         res.send({
//             message: 'Error Occurred'
//         })
//     }
// })

comAdminApp.put('/get-community', async (req, res) => {
    let arr=req.body.arr
    let resObj = await comAdminCollection.find({id:{$in:arr}}).toArray()
    if (resObj != null) {
        res.send({
            message: 'Community',
            payload: resObj
        })
    }
    else {
        res.send({
            message: 'Error Occurred'
        })
    }
})

comAdminApp.put('/guidelines/edit', async (req, res) => {
    let guidelineObj = req.body
    let resObj1 = await comAdminCollection.findOne({ id: guidelineObj.id })
    if (resObj1 == null) {
        res.send({
            message: "Invalid community id"
        })
    }
    else {
        let arr = resObj1.guidelines
        arr[guidelineObj.index] = guidelineObj.guideline
        let resObj2 = await comAdminCollection.updateOne({ id: guidelineObj.id }, { $set: { guidelines: arr } })
        if (resObj2 == null) {
            res.send({
                message: "Error Occurred"
            })
        }
        else {
            res.send({
                message: "Guidelines updated successfully"
            })
        }
    }
});

comAdminApp.put('/guidelines/add', async (req, res) => {
    let guidelineObj = req.body
    let resObj1 = await comAdminCollection.findOne({ id: guidelineObj.id })
    if (resObj1 == null) {
        res.send({
            message: "Invalid community id"
        })
    }
    else {
        let arr = resObj1.guidelines
        arr.push(guidelineObj.guideline)
        let resObj2 = await comAdminCollection.updateOne({ id: guidelineObj.id }, { $set: { guidelines: arr } })
        if (resObj2 == null) {
            res.send({
                message: "Error Occurred"
            })
        }
        else {
            res.send({
                message: "Guideline added successfully"
            })
        }
    }
});

comAdminApp.put('/guidelines/delete', async (req, res) => {
    let guidelineObj = req.body
    let resObj1 = await comAdminCollection.findOne({ id: guidelineObj.id })
    if (resObj1 == null) {
        res.send({
            message: "Invalid community id"
        })
    }
    else {
        let arr = resObj1.guidelines
        arr.splice(guidelineObj.index,1)
        let resObj2 = await comAdminCollection.updateOne({ id: guidelineObj.id }, { $set: { guidelines: arr } })
        if (resObj2 == null) {
            res.send({
                message: "Error Occurred"
            })
        }
        else {
            res.send({
                message: "Guideline deleted successfully"
            })
        }
    }
});

comAdminApp.put('/new-admin', async (req, res) => {
    let adminObj = req.body
    let resObj1 = await comAdminCollection.findOne({ id: adminObj.id })
    if (resObj1 == null) {
        res.send({
            message: "Invalid community id"
        })
    }
    else {
        let resObj2 = await usersCollection.findOne({ username: adminObj.username })
        if (resObj2 != null) {
            let resObj3 = resObj1.residents.filter((ele)=>{
                return ele.username==adminObj.username
            })
            if (resObj3.length!=0) {
                let resObj4 = await comAdminCollection.updateOne({ id: adminObj.id }, { $addToSet: { admins: resObj3[0] } })
                if (resObj4 == null) {
                    res.send({
                        message: "Error Occurred"
                    })
                }
                else {
                    res.send({
                        message: "Admin added successfully"
                    })
                }
            }
            else {
                res.send({
                    message: 'Admin being added is not a resident'
                })
            }
        }
        else {
            res.send({
                message: "Username doesn't exist"
            })
        }
    }
});

comAdminApp.put('/announcement', async (req, res) => {
    let announcementObj = req.body
    let resObj1 = await comAdminCollection.findOne({ id: announcementObj.id })
    if (resObj1 == null) {
        res.send({
            message: "Invalid community id"
        })
    }
    else {
        let resObj2 = await comAdminCollection.updateOne({ id: announcementObj.id }, { $addToSet: { announcements: { username: announcementObj.username, announcement: announcementObj.announcement } } })
        if (resObj2 == null) {
            res.send({
                message: "Error Occurred"
            })
        }
        else {
            res.send({
                message: "Announcement added successfully"
            })
        }
    }
});

comAdminApp.put('/announcement/edit', async (req, res) => {
    let announcementObj = req.body
    let resObj1 = await comAdminCollection.findOne({ id: announcementObj.id })
    if (resObj1 == null) {
        res.send({
            message: "Invalid community id"
        })
    }
    else {
        let announcements=resObj1.announcements
        announcements[announcementObj.index]={username:announcements[announcementObj.index].username,announcement:announcementObj.announcement}
        let resObj2 = await comAdminCollection.updateOne({ id: announcementObj.id}, { $set: { announcements: announcements} })
        if (resObj2 == null) {
            res.send({
                message: "Error Occurred"
            })
        }
        else {
            res.send({
                message: "Announcement updated successfully"
            })
        }
    }
});

comAdminApp.put('/announcement/delete',async(req,res)=>{
    let announcementObj=req.body
    let resObj=await comAdminCollection.findOne({id:announcementObj.id})
    if(resObj!=null){
        resObj.announcements=resObj.announcements.filter((ele,ind)=>{
            return ind!=announcementObj.index
        })
        let resObj2=await comAdminCollection.updateOne({id:announcementObj.id},{$set:{announcements:resObj.announcements}})
        if(resObj2.modifiedCount!=null){
            res.send({
                message:"Announcement successfully deleted"
            })
        }
        else{
            res.send({
                message:"Error occurred"
            })
        }
    }
    else{
        res.send("Invalid community id")
    }
})

comAdminApp.put('/discussion-forum', async (req, res) => {
    let discussionForumObj = req.body
    let resObj1 = await comAdminCollection.findOne({ id: discussionForumObj.cid })
    if (resObj1 == null) {
        res.send({
            message: "Invalid community id"
        })
    }
    else {
        let resObj2 = await comAdminCollection.updateOne({ id: discussionForumObj.cid }, { $addToSet: { disforum: { id: discussionForumObj.id, username: discussionForumObj.username, topic: discussionForumObj.topic, comments: [], time: discussionForumObj.time } } })
        if (resObj2 == null) {
            res.send({
                message: "Error Occurred"
            })
        }
        else {
            res.send({
                message: "Discussion Forum added successfully"
            })
        }
    }
});

comAdminApp.put('/discussion-forum/delete', async (req, res) => {
    let deleteObj=req.body
    let resObj1 = await comAdminCollection.findOne({ id: deleteObj.cid })
    if (resObj1 == null) {
        res.send({
            message: "Invalid community id"
        })
    }
    else {
        resObj1.disforum=resObj1.disforum.filter((obj,idx)=>{
            return idx!=deleteObj.index
        })
        let resObj2 = await comAdminCollection.updateOne({ id: deleteObj.cid }, { $set: { disforum: resObj1.disforum } })
        if (resObj2 == null) {
            res.send({
                message: "Error Occurred"
            })
        }
        else {
            res.send({
                message: "Discussion Forum deleted successfully"
            })
        }
    }
});

comAdminApp.put('/poll',async(req,res)=>{
    let pollObj=req.body
    let resObj1=await comAdminCollection.findOne({id:pollObj.cid})
    if(resObj1!=null){
        let resObj2=await comAdminCollection.updateOne({id:pollObj.cid},{$addToSet:{poll:{id:pollObj.id,username:pollObj.username,question:pollObj.question,options:pollObj.options,voted:[],time:pollObj.time}}})
        if(resObj2.modifiedCount>0){
            res.send({
                message:"Poll created successfully"
            })
        }
        else{
            res.send({
                message:"Error Occurred"
            })
        }
    }
    else{
        res.send({
            message:"Invalid communty id"
        })
    }
})

comAdminApp.put('/poll/delete', async (req, res) => {
    let pollObj=req.body
    let resObj1=await comAdminCollection.findOne({id:pollObj.cid})
    if (resObj1 == null) {
        res.send({
            message: "Invalid community id"
        })
    }
    else {
        resObj1.poll=resObj1.poll.filter((obj)=>{
            return obj.id!=pollObj.id
        })
        let resObj2 = await comAdminCollection.updateOne({ id: pollObj.cid }, { $set: { poll: resObj1.poll } })
        if (resObj2 == null) {
            res.send({
                message: "Error Occurred"
            })
        }
        else {
            res.send({
                message: "Poll deleted successfully"
            })
        }
    }
});

comAdminApp.put('/business',async(req,res)=>{
    let businessObj=req.body
    let resObj1=await comAdminCollection.findOne({id:businessObj.cid})
    if(resObj1!=null){
        let resObj2=await comAdminCollection.updateOne({id:businessObj.cid},{$addToSet:{business:{id:businessObj.id,username:businessObj.username,shopName:businessObj.shopName,shopNo:businessObj.shopNo}}})
        if(resObj2.modifiedCount>0){
            res.send({
                message:"Business created successfully"
            })
        }
        else{
            res.send({
                message:"Error Occurred"
            })
        }
    }
    else{
        res.send({
            message:"Invalid communty id"
        })
    }
})

comAdminApp.put('/business/delete', async (req, res) => {
    let businessObj=req.body
    let resObj1=await comAdminCollection.findOne({id:businessObj.cid})
    if (resObj1 == null) {
        res.send({
            message: "Invalid community id"
        })
    }
    else {
        resObj1.business=resObj1.business.filter((obj)=>{
            return obj.id!=businessObj.id
        })
        let resObj2 = await comAdminCollection.updateOne({ id: businessObj.cid }, { $set: { business: resObj1.business } })
        if (resObj2 == null) {
            res.send({
                message: "Error Occurred"
            })
        }
        else {
            res.send({
                message: "Business deleted successfully"
            })
        }
    }
});

comAdminApp.put('/event',async(req,res)=>{
    let eventObj=req.body
    let resObj1=await comAdminCollection.findOne({id:eventObj.cid})
    if(resObj1!=null){
        let resObj2=await comAdminCollection.updateOne({id:eventObj.cid},{$addToSet:{event:{id:eventObj.id,hostUsername:eventObj.hostUsername,eventName:eventObj.eventName,date:eventObj.date,type:eventObj.type,venue:eventObj.venue,volunteer:eventObj.volunteer}}})
        if(resObj2.modifiedCount>0){
            res.send({
                message:"Event created successfully"
            })
        }
        else{
            res.send({
                message:"Error Occurred"
            })
        }
    }
    else{
        res.send({
            message:"Invalid communty id"
        })
    }
})

comAdminApp.put('/event/delete', async (req, res) => {
    let eventObj=req.body
    let resObj1=await comAdminCollection.findOne({id:eventObj.cid})
    if (resObj1 == null) {
        res.send({
            message: "Invalid community id"
        })
    }
    else {
        resObj1.event=resObj1.event.filter((obj)=>{
            return obj.id!=eventObj.id
        })
        let resObj2 = await comAdminCollection.updateOne({ id: eventObj.cid }, { $set: { event: resObj1.event } })
        if (resObj2 == null) {
            res.send({
                message: "Error Occurred"
            })
        }
        else {
            res.send({
                message: "Event deleted successfully"
            })
        }
    }
});

comAdminApp.put('/sports',async(req,res)=>{
    let sportsObj=req.body
    let resObj1=await comAdminCollection.findOne({id:sportsObj.cid})
    if(resObj1!=null){
        let keys=Object.keys(sportsObj)
        keys=keys.filter(obj=>obj!='cid')
        let newObj={}
        keys.map((key)=>{
            newObj[key]=sportsObj[key]
        })
        let resObj2=await comAdminCollection.updateOne({id:sportsObj.cid},{$addToSet:{sports:newObj}})
        if(resObj2.modifiedCount>0){
            res.send({
                message:"Sports added successfully"
            })
        }
        else{
            res.send({
                message:"Error occurred"
            })
        }
    }
    else{
        res.send({
            message:"Invalid community id"
        })
    }
})

module.exports = comAdminApp
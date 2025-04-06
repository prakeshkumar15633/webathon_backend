const exp = require('express');
const roomsApi = exp.Router();

let roomCollection;
let usersCollection;

roomsApi.use((req, res, next) => {
    roomCollection = req.app.get('roomCollection');
    usersCollection = req.app.get('usersCollection');
    next();
});

// ------------------- GET ROOMS -------------------

roomsApi.post('/getRooms', async (req, res) => {
    try {
        const { email, floor, roomType, roomCapacity } = req.body;

        if (!email) return res.status(400).json({ message: 'Email is required.' });
        if (!floor) return res.status(400).json({ message: 'Floor is required.' });
        if (!roomType) return res.status(400).json({ message: 'Room type is required.' });
        if (!roomCapacity) return res.status(400).json({ message: 'Room capacity is required.' });

        const vacancyRooms = await roomCollection.find({ vacancy: { $gt: 0 } }).toArray();
        if (vacancyRooms.length === 0) {
            return res.status(200).json({ message: 'No rooms available with any vacancy.', count: 0, matchedRooms: [] });
        }

        const floorRooms = vacancyRooms.filter(room => room.floor == floor);
        if (floorRooms.length === 0) {
            return res.status(200).json({ message: `No rooms available on floor ${floor}.`, count: 0, matchedRooms: [] });
        }

        const typeRooms = floorRooms.filter(room => room.roomType === roomType);
        if (typeRooms.length === 0) {
            return res.status(200).json({ message: `No rooms of type ${roomType} available on floor ${floor}.`, count: 0, matchedRooms: [] });
        }

        const finalRooms = typeRooms.filter(room => room.roomCapacity == roomCapacity);
        if (finalRooms.length === 0) {
            return res.status(200).json({ message: `No rooms with capacity ${roomCapacity}, type ${roomType} on floor ${floor}.`, count: 0, matchedRooms: [] });
        }

        return res.status(200).json({
            message: 'Rooms found successfully.',
            email,
            matchedRooms: finalRooms,
            count: finalRooms.length
        });

    } catch (err) {
        console.error('Error in /getRooms:', err);
        return res.status(500).json({
            message: 'Something went wrong while fetching rooms.',
            error: err.message
        });
    }
});

// ------------------- BOOK ROOM -------------------

roomsApi.post('/bookRooms', async (req, res) => {
    try {
        const { email, floor, roomType, roomCapacity, roomNo } = req.body;

        if (!email || !floor || !roomType || !roomCapacity || !roomNo) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const roomNoNum = parseInt(roomNo);
        if (isNaN(roomNoNum)) {
            return res.status(400).json({ message: 'Invalid room number.' });
        }

        // Find room by roomNo
        const roomDoc = await roomCollection.findOne({ roomNo: roomNoNum });
        if (!roomDoc) {
            return res.status(404).json({ message: `Room with number ${roomNoNum} not found.` });
        }

        if (roomDoc.vacancy <= 0) {
            return res.status(400).json({ message: `Room ${roomNoNum} is fully booked.` });
        }

        // Update room: push email to users[], decrement vacancy
        const roomUpdateResult = await roomCollection.updateOne(
            { roomNo: roomNoNum },
            {
                $push: { users: email },
                $inc: { vacancy: -1 }
            }
        );

        if (roomUpdateResult.modifiedCount === 0) {
            return res.status(400).json({ message: `Failed to update room ${roomNoNum}.` });
        }

        // Update user’s room info
        const updateUserResult = await usersCollection.updateOne(
            { email: email },
            {
                $set: {
                    room: {
                        floor: parseInt(floor),
                        roomNo: roomNoNum,
                        roomType: roomType,
                        roomCapacity: parseInt(roomCapacity)
                    }
                }
            }
        );

        if (updateUserResult.matchedCount === 0) {
            return res.status(404).json({ message: `User with email ${email} not found.` });
        }

        return res.status(200).json({
            message: `Room ${roomNoNum} booked successfully for ${email}.`,
            roomUpdated: true,
            userUpdated: true
        });

    } catch (err) {
        console.error('Error in /bookRooms:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

module.exports = roomsApi;

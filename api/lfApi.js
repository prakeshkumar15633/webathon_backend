const express = require('express');
const { ObjectId } = require('mongodb'); // ✅ Import ObjectId from mongodb

module.exports = (lfCollection) => {
    const router = express.Router();

    // GET all lost items
    router.get('/', async (req, res) => {
        try {
            const items = await lfCollection.find().toArray();
            res.json(items);
        } catch (err) {
            console.error("Error fetching items:", err);
            res.status(500).json({ message: "Failed to fetch lost items." });
        }
    });

    // POST /lost-items/claim/:id
    router.post('/claim/:id', async (req, res) => {
        try {
            const itemId = req.params.id;

            const result = await lfCollection.updateOne(
                { _id: new ObjectId(itemId) },
                { $set: { claimed: "yes" } }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ message: "Item not found or already claimed." });
            }

            res.json({ message: "Item successfully claimed", result });
        } catch (err) {
            console.error("Error claiming item:", err);
            res.status(500).json({ message: "Error claiming item" });
        }
    });

    return router;
};
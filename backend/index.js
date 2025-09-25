// backend/index.js or backend/app.js
const mongoose = require("mongoose");

const mongoURI = "mongodb+srv://admin:your-password@cluster0.mongodb.net/typeaware?retryWrites=true&w=majority";

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

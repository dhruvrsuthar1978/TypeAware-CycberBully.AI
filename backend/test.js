const mongoose = require('mongoose');

const uri = "mongodb+srv://dhruvrsuthar1978_db_user:dhruv2036@cluster0.hpibcvn.mongodb.net/moderation-app?retryWrites=true&w=majority";

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  process.exit();
})
.catch((err) => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});

const mongoose = require("mongoose");
require("dotenv").config();
const url='mongodb+srv://kartikshingde12:Kartik8830@namastenode.d6rrw0p.mongodb.net/fever-care';
console.log(url)
const connectDB = async () => {
  await mongoose.connect(url);
};

module.exports = connectDB;
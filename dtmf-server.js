var express = require("express");
var app = express()
app.listen(3333)
console.log("My server is running on localhost:3333");
app.use(express.static('public'))

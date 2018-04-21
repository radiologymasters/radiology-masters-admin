const express = require("express");
const app = express();

app.use("/", express.static(__dirname));

var port = process.env.PORT || 3000;
var ip = process.env.IP || "127.0.0.1";

app.listen(port, ip, function () {
  console.log('Radiology Masters web server is running');
});
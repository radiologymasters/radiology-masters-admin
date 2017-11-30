const express = require("express");
const app = express();

app.use("/", express.static(__dirname));

app.listen(process.env.PORT, process.env.IP, function () {
  console.log('Radiology Masters web server is running');
});
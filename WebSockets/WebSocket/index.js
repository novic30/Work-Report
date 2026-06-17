const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express"); //import
const app = express(); //making app using express
const path = require("path");

const httpServer = createServer(app);
const io = new Server(httpServer);

httpServer.listen(5000, () => {
  //Listen in port 5000
  console.log("Server is listening on http://localhost:5000");
});
app.get("/", (req, res, next) => {
  res.sendFile(path.join(__dirname, "./public/index.html"));
});

io.on("connection", (socket) => {
  socket.on("msgFromFrontend", (msg) => {
    console.log(msg);
    //  io.emit("msgFromBackend", "hello I am from Backend");
    io.emit("msgFromBackend", `${socket.id}: ${msg}`);
  });
}); //Turn on io socket

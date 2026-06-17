
### Upgrade
HTTP request and response would contain UPGRADE http header to upgrade the connection to a different protocol (over same transport protocol http https).

Eg. It can be used to upgrade a connection from 
- HTTP/1.1 to HTTP/2
- HTTP(S) to WebSocket

# Server Initialization

https://socket.io/docs/v3/server-initialization/

# Code and functions
```js
Declare socket in index.js:
const { createServer } = require("http");//provides the port and the http connection

const { Server } = require("socket.io");//upgrades http connection from createServer to socket connection

const express = require("express"); //import express which is used to make app which is where all the apis are made

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

  console.log("a user connected");
  socket.on("messageFromFrontend", (msg) =>{
	  console.log(msg);
	  io.emit("msgFromBackend", "Hello I am backend message")
  }) //Socket function like emit but this time, it recieves message variable messageFromFrontend and logs it and additionally emits message back to frontend which would process it if it has relevant functions to do so

}); //Turn on io socket and send notification if a user is using socket


In index.html script:


      socket.emit("messageFromFrontend", "Hello World from frontend"); //This sends post request type stuff from frontend to backend
      socket.on("msgFromBackend", (msg) => {
		     console.log(msg);
      });//socket.on recieves the message from backend and logs it.

```

# Socket ID
When a user is connected, they are given a unique ID which can be accessed through 
```js
socket.id
```

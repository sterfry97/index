const express = require("express");
const { createServer } = require("http");
const path = require("path");
const { BareServer } = require("@tomphttp/bare-server-node");

const app = express();
const server = createServer();
const bareServer = new BareServer("/bare/");

// Serve Scramjet files
app.use("/scramjet/", express.static(
  path.join(__dirname, "node_modules/@mercuryworkshop/scramjet/dist")
));

// Serve your frontend
app.use(express.static(path.join(__dirname, "public")));

server.on("request", (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(0, () => {
  const PORT = server.address().port;
  console.log(`Running at http://localhost:${PORT}`);
});
let socket = io.connect("http://localhost:8080");

function init() {
  draw();

  socket.emit("init", {
    playerName: player.name,
  });
}

socket.on("initReturn", (data) => {
  //   console.log(data.orbs);
  orbs = data.orbs;

  setInterval(() => {
    if (player.xVector) {
      socket.emit("tick", {
        xVector: player.xVector,
        yVector: player.yVector,
      });
    }
  }, 33);
});

socket.on("tock", (data) => {
  //   console.log("tock data:", data);
  players = data.players;
  player.locX = data.playerX;
  player.locY = data.playerY;
});

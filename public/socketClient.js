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
});

socket.on("orbSwitch", (data) => {
  orbs.splice(data.orbIndex, 1, data.newOrb);
});

// for updating camera location
socket.on("socketTock", (data) => {
  player.locX = data.playerX;
  player.locY = data.playerY;
});

socket.on("updateLeaderBoard", (data) => {
  //   console.log(data);
  document.querySelector(".leader-board").innerHTML = "";

  data.forEach((plr) => {
    document.querySelector(
      ".leader-board"
    ).innerHTML += `<li class="leaderboard-player">${plr.name} - ${plr.score}</li>`;
  });
});

// feature similar to PUBG, announcing the identity of killer and one died
socket.on("playerDeath", (data) => {
  document.querySelector(
    "#game-message"
  ).innerHTML = `${data.died.name} absorbed by ${data.killedBy.name}`;

  $("#game-message").css({
    "background-color": "#00e6e6",
    opacity: 1,
  });
  $("#game-message").show();
  $("#game-message").fadeOut(5000);
});

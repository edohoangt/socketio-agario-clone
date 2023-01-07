const io = require("../server").io;

const Orb = require("./classes/Orb");
const Player = require("./classes/Player");
const PlayerData = require("./classes/PlayerData");
const PlayerConfig = require("./classes/PlayerConfig");

const {
  checkForOrbCollisions,
  checkForPlayerCollisions,
} = require("./checkCollision");

let orbs = [];
let players = [];
let settings = {
  defaultNumOrbs: 50,
  defaultSpeed: 6,
  defaultSize: 6,
  defaultZoom: 1.5, // zoom out as player gets bigger
  worldWidth: 500,
  worldHeight: 500,
};

// setInterval(() => {
//   if (players.length > 0) {
//     io.to("game").emit("tock", {
//       players,
//     });
//   }
// }, 33);

initGame();

io.sockets.on("connect", (socket) => {
  let player = {};

  socket.on("init", (data) => {
    socket.join("game");
    let playerConfig = new PlayerConfig(settings);
    let playerData = new PlayerData(data.playerName, settings);
    player = new Player(socket.id, playerConfig, playerData);

    setInterval(() => {
      socket.emit("socketTock", {
        playerX: player.playerData.locX,
        playerY: player.playerData.locY,
      });

      socket.emit("tock", {
        // players: players.filter((pl) => pl.uid !== player.playerData.uid),
        players,
      });
    }, 33);

    socket.emit("initReturn", {
      orbs,
    });

    players.push(playerData);
  });

  socket.on("tick", (data) => {
    if (!(data.xVector && data.yVector)) {
      return;
    }
    speed = player.playerConfig.speed;
    xV = player.playerConfig.xVector = data.xVector;
    yV = player.playerConfig.yVector = data.yVector;

    if (
      (player.playerData.locX < 5 && xV < 0) ||
      (player.playerData.locX > settings.worldWidth && xV > 0)
    ) {
      player.playerData.locY -= speed * yV;
    } else if (
      (player.playerData.locY < 5 && yV > 0) ||
      (player.playerData.locY > settings.worldHeight && yV < 0)
    ) {
      player.playerData.locX += speed * xV;
    } else {
      player.playerData.locX += speed * xV;
      player.playerData.locY -= speed * yV;
    }

    // check orb collision
    let capturedOrb = checkForOrbCollisions(
      player.playerData,
      player.playerConfig,
      orbs,
      settings
    );
    capturedOrb
      .then((data) => {
        // console.log("orb collision at " + data);
        const orbData = {
          orbIndex: data,
          newOrb: orbs[data],
        };

        io.sockets.emit("orbSwitch", orbData);
        io.sockets.emit("updateLeaderBoard", getLeaderBoard());
      })
      .catch(() => {
        // no collision
      });

    // check player collision
    let playerDeath = checkForPlayerCollisions(
      player.playerData,
      player.playerConfig,
      players,
      player.playerData.uid
    );
    playerDeath
      .then((data) => {
        // console.log("player collision");
        io.sockets.emit("updateLeaderBoard", getLeaderBoard());
        io.sockets.emit("playerDeath", data);
      })
      .catch(() => {
        // no collision
      });
  });

  socket.on("disconnect", (data) => {
    if (player.playerData) {
      // avoid reading undefined when player connect and leave without playing the game
      players.forEach((curPlayer, i) => {
        if (curPlayer.uid == player.playerData.uid) {
          players.splice(i, 1);
        }
      });

      const updateStats = `
        UPDATE stats
            SET highScore = CASE WHEN highScore < ? THEN ? ELSE highScore END,
            mostOrbs = CASE WHEN mostOrbs < ? THEN ? ELSE mostOrbs END,
            mostPlayers = CASE WHEN mostPlayers < ? THEN ? ELSE mostPlayers END
        WHERE username = ?
      `;
    }
  });
});

function getLeaderBoard() {
  players.sort((a, b) => {
    return b.score - a.score;
  });

  let leaderBoard = players.map((plr) => {
    return {
      name: plr.name,
      score: plr.score,
    };
  });

  return leaderBoard;
}

// run at the beginning of a new game
function initGame() {
  for (let i = 0; i < settings.defaultNumOrbs; i++) {
    orbs.push(new Orb(settings));
  }
}

module.exports = io;

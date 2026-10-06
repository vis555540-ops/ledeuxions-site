// Create variables for use in our game.
var Game = {};

// Global game config
Game.config = {
  startingPlayer: "black", // Choose 'black' or 'red'.
  takenMsg: "이미 찬 칸이에요. 다른 칸을 골라 주세요.",
  drawMsg: "비겼어요!",
  winMsg: "이긴 사람: ",
  countToWin: 4,

  // note: board dimensions are zero-indexed
  boardLength: 6,
  boardHeight: 5,
};

// Global Game State
Game.board = [[0,0,0,0,0,0,0],
              [0,0,0,0,0,0,0],
              [0,0,0,0,0,0,0],
              [0,0,0,0,0,0,0],
              [0,0,0,0,0,0,0],
              [0,0,0,0,0,0,0]];

Game.currentPlayer = Game.config.startingPlayer;

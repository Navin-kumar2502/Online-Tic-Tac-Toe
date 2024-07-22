const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://online-tic-tac-toe-client.onrender.com", // Update this line
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: "https://online-tic-tac-toe-client.onrender.com" // Update this line
}));
const PORT = process.env.PORT || 4000;
let rooms = {};

io.on('connection', (socket) => {

  socket.on('createRoom', (roomId, playerId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [{ id: socket.id, playerId }], board: Array(9).fill(null), moves: 0 };
      socket.join(roomId);
      socket.emit('roomCreated', { roomId, playerId });
    } else {
      socket.emit('error', 'Room already exists');
    }
  });

  socket.on('joinRoom', (roomId, playerId) => {
    if (rooms[roomId] && rooms[roomId].players.length < 2) {
      rooms[roomId].players.push({ id: socket.id, playerId });
      socket.join(roomId);
      socket.emit('roomJoined', { roomId, playerId });
      io.in(roomId).emit('startGame', rooms[roomId].players);
    } else {
      socket.emit('error', 'Room is full or does not exist');
    }
  });

  socket.on('makeMove', ({ roomId, index, player }) => {
    if (rooms[roomId]) {
      rooms[roomId].board[index] = player;
      rooms[roomId].moves++;
      io.in(roomId).emit('moveMade', { board: rooms[roomId].board, moves: rooms[roomId].moves });

      // Check for winner after every move
      const winner = checkWinner(rooms[roomId].board);
      if (winner) {
        io.in(roomId).emit('gameOver', { winner, board: rooms[roomId].board });
        cleanupRoom(roomId);
      } else if (rooms[roomId].moves === 9) { // Check for draw
        io.in(roomId).emit('gameOver', { winner: 'draw', board: rooms[roomId].board });
        cleanupRoom(roomId);
      }
    }
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter((player) => player.id !== socket.id);
      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId];
      }
    }
  });

  // Helper function to check for a winner
  const checkWinner = (board) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  // Helper function to clean up room after game ends
  const cleanupRoom = (roomId) => {
    delete rooms[roomId];
  };
});

server.listen(PORT);

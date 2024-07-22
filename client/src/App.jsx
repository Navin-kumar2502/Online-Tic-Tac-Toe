import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('https://online-tic-tac-toe-hgq1.onrender.com');

const App = () => {
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [moves, setMoves] = useState(0);
  const [isXNext, setIsXNext] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [winningLine, setWinningLine] = useState(null);

  const handleCreateRoom = () => {
    setPlayerId('X');
    socket.emit('createRoom', roomId, 'X');
  };

  const handleJoinRoom = () => {
    setPlayerId('O');
    socket.emit('joinRoom', roomId, 'O');
  };

  const handleClick = (index) => {
    if (!board[index] && !gameOver && isXNext === (playerId === 'X')) {
      socket.emit('makeMove', { roomId, index, player: playerId });
    }
  };

  useEffect(() => {
    socket.on('roomCreated', ({ roomId, playerId }) => {
      setInRoom(true);
      setPlayerId(playerId);
    });

    socket.on('roomJoined', ({ roomId, playerId }) => {
      setInRoom(true);
      setPlayerId(playerId);
    });

    socket.on('startGame', () => {
      setInRoom(true);
    });

    socket.on('moveMade', ({ board, moves }) => {
      setBoard(board);
      setMoves(moves);
      setIsXNext(!isXNext);
    });

    socket.on('gameOver', ({ winner, board, winningLine }) => {
      setGameOver(true);
      setWinner(winner);
      setBoard(board);
      setWinningLine(winningLine);
      setTimeout(() => {
        setInRoom(false);
        setGameOver(false);
        setWinner('');
        setBoard(Array(9).fill(null));
        setMoves(0);
        setWinningLine(null);
      }, 5000); // Refresh back to home page after 5 seconds
    });

    socket.on('error', (message) => {
      console.error('Socket error:', message);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('startGame');
      socket.off('moveMade');
      socket.off('gameOver');
      socket.off('error');
    };
  }, [isXNext, playerId]);

  const renderSquare = (i) => {
    let markStyle = '';
    if (winningLine && winningLine.includes(i)) {
      markStyle = 'animate-pulse text-6xl';
    } else {
      markStyle = 'text-4xl';
    }

    if (board[i] === 'X') {
      return (
        <button
          className={`w-20 h-20 border-2 border-gray-600 bg-black text-red-600 font-bold ${markStyle} flex items-center justify-center`}
          onClick={() => handleClick(i)}
        >
          X
        </button>
      );
    } else if (board[i] === 'O') {
      return (
        <button
          className={`w-20 h-20 border-2 border-gray-600 bg-black text-blue-500 font-bold ${markStyle} flex items-center justify-center`}
          onClick={() => handleClick(i)}
        >
          O
        </button>
      );
    } else {
      return (
        <button
          className="w-20 h-20 border-2 border-gray-600 bg-black text-gray-200 text-4xl flex items-center justify-center hover:bg-gray-800 focus:outline-none"
          onClick={() => handleClick(i)}
        >
          {board[i]}
        </button>
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-lg mx-auto text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Online Tic Tac Toe</h1>
        {!inRoom ? (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <input
              className="mb-4 p-2 border-2 border-gray-400 rounded-lg text-center w-full"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
            />
            <div className="flex justify-center space-x-4">
              <button className="p-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 focus:outline-none" onClick={handleCreateRoom}>
                Create Room
              </button>
              <button className="p-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 focus:outline-none" onClick={handleJoinRoom}>
                Join Room
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-3 gap-2 mt-8">
              {Array(9)
                .fill(null)
                .map((_, i) => (
                  <div key={i} className="relative">
                    {renderSquare(i)}
                    {winningLine && winningLine.includes(i) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.93 7.071a1 1 0 00-1.414-1.414L12 11.172l-3.515-3.515a1 1 0 00-1.414 1.414L10.828 12l-3.515 3.515a1 1 0 001.414 1.414L12 12.828l3.515 3.515a1 1 0 001.414-1.414L13.172 12l3.515-3.515z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            <div className="mt-8">
              {gameOver && (
                <div className="text-center">
                  {winner === 'draw' ? (
                    <p className="text-xl text-gray-100">It's a draw!</p>
                  ) : (
                    <p className="text-xl text-gray-100">{winner} wins!</p>
                  )}
                  <p className="text-gray-200 mt-2">Returning to homepage in 5 seconds...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

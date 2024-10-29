// Wait for the DOM to be fully loaded before executing code
document.addEventListener("DOMContentLoaded", () => {
  let board = null; // Initialize the chessboard
  const game = new Chess(); // Create new Chess.js game instance
  const moveHistory = document.getElementById("move-history"); // Get move history container
  let moveCount = 1; // Initialize the move count
  let userColor = "w"; // Initialize the user's color as white
  var stockfish = new Worker("stockfish.js");
  // Function to make a random move for the computer
  // Function to make a random move for the computer
  const makeMove = () => {
    if (game.game_over()) {
      alert("Game over!");
      return;
    }

    // Initialize Stockfish engine
    stockfish.postMessage("uci");

    stockfish.onmessage = (event) => {
      const message = event.data;

      // When Stockfish is ready
      if (message.includes("uciok")) {
        stockfish.postMessage("position fen " + game.fen());
        stockfish.postMessage("go movetime 1000"); // Allow Stockfish 1 second to think
      }

      // When Stockfish has determined the best move
      else if (message.includes("bestmove")) {
        const lanMove = message.split(" ")[1]; // Extract the best move in LAN format
        // Convert LAN move to SAN format
        const move = game.move({
          from: lanMove.slice(0, 2),
          to: lanMove.slice(2, 4),
          promotion: "q",
        });

        if (move) {
          board.position(game.fen()); // Update the board position
          recordMove(move.san, moveCount); // Record the move in SAN format
          moveCount++; // Increment the move count
        }
      }
    };
  };

  // Function to record and display a move in the move history
  const recordMove = (move, count) => {
    const formattedMove =
      count % 2 === 1 ? `${Math.ceil(count / 2)}. ${move}` : `${move} -`;
    moveHistory.textContent += formattedMove + " ";
    moveHistory.scrollTop = moveHistory.scrollHeight; // Auto-scroll to the latest move
  };

  // Function to handle the start of a drag position
  const onDragStart = (source, piece) => {
    // Allow the user to drag only their own pieces based on color
    return !game.game_over() && piece.search(userColor) === 0;
  };

  // Function to handle a piece drop on the board
  const onDrop = (source, target) => {
    const move = game.move({
      from: source,
      to: target,
      promotion: "q",
    });

    if (move === null) return "snapback";

    window.setTimeout(makeMove, 250);
    recordMove(move.san, moveCount); // Record and display the move with move count
    moveCount++;
  };

  // Function to handle the end of a piece snap animation
  const onSnapEnd = () => {
    board.position(game.fen());
  };

  // Configuration options for the chessboard
  const boardConfig = {
    showNotation: true,
    draggable: true,
    position: "start",
    onDragStart,
    onDrop,
    onSnapEnd,
    moveSpeed: "fast",
    snapBackSpeed: 500,
    snapSpeed: 100,
  };

  // Initialize the chessboard
  board = Chessboard("board", boardConfig);

  // Event listener for the "Play Again" button
  document.querySelector(".play-again").addEventListener("click", () => {
    game.reset();
    board.start();
    moveHistory.textContent = "";
    moveCount = 1;
    userColor = "w";
  });

  // Event listener for the "Set Position" button
  document.querySelector(".set-pos").addEventListener("click", () => {
    const fen = prompt("Enter the FEN notation for the desired position!");
    if (fen !== null) {
      if (game.load(fen)) {
        board.position(fen);
        moveHistory.textContent = "";
        moveCount = 1;
        userColor = "w";
      } else {
        alert("Invalid FEN notation. Please try again.");
      }
    }
  });

  // Event listener for the "Flip Board" button
  document.querySelector(".flip-board").addEventListener("click", () => {
    board.flip();
    makeMove();
    // Toggle user's color after flipping the board
    userColor = userColor === "w" ? "b" : "w";
  });
});

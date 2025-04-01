const localIP = window.location.hostname;

const PORT = window.config.backendPort;
const apiEndpoint = `${localIP}:${PORT}`;
let session_starts = false;

console.log(`Server Address: ${apiEndpoint}`);
let ws;
try {
    ws = new WebSocket(`ws://${apiEndpoint}`);
}
catch (err) {
    console.log("Can't connect:", err);
}
const board = document.getElementById('board');

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const make_move = function(from, to) {
    const pickedPiece = board.children[from].firstChild;
            
    board.children[to].appendChild(pickedPiece);
    pickedPiece.dataset.row = Math.floor(to / 8);
    pickedPiece.dataset.col = to % 8;
}

let valid_move = null;

ws.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.type === "full_server" || data.type === "session_end") {
        console.error("Error from server:", data.message);
        window.location.href = data.redirectUrl; // Redirect to the error page
        return;
    }
	else if (data["type"] === "update_board") {
        if (session_starts === false) {
            ws.send(JSON.stringify({
                type: "meta",
                session_starts: true
            }));
        }
        session_starts = true;
		let endSquare = Number(data.endSquare);
		let startSquare = Number(data.startSquare);
        
		const child = board.children[endSquare].firstChild;
		if (child)
			child.remove();
        make_move(startSquare, endSquare);

        if (data["move_state"] === "castling") {
            endSquare = Number(data.rockEnd);
            startSquare = Number(data.rockStart);
            make_move(startSquare, endSquare);
        }
	}
    if (data["type"] === "game_over") {
        document.body.innerHTML = `
            <div style="text-align:center; margin-top:20%;">
                <h1>Game Over</h1>
                <p>${data.message}</p>
            </div>`;
        document.body.style.backgroundColor = "#000";
        document.body.style.color = "#fff";
    }
}

function draw_checkboard () {
    // Create the board
    for (let i = 0; i < 64; i++) {
        const square = document.createElement('div');
        square.classList.add('square');
        if (Math.floor(i / 8) % 2 === 0) {
            square.style.backgroundColor = i % 2 === 0 ? '#eeeed2' : '#769656';
        } else {
            square.style.backgroundColor = i % 2 === 0 ? '#769656' : '#eeeed2';
        }
        board.appendChild(square);
    }

    // Add pieces using Unicode characters
    const initialPositions = {
        0: '♜', 1: '♞', 2: '♝', 3: '♛', 4: '♚', 5: '♝', 6: '♞', 7: '♜',
        8: '♟', 9: '♟', 10: '♟', 11: '♟', 12: '♟', 13: '♟', 14: '♟', 15: '♟',
        48: '♙', 49: '♙', 50: '♙', 51: '♙', 52: '♙', 53: '♙', 54: '♙', 55: '♙',
        56: '♖', 57: '♘', 58: '♗', 59: '♕', 60: '♔', 61: '♗', 62: '♘', 63: '♖'
    };

    for (const [index, piece] of Object.entries(initialPositions)) {
        const pieceElement = document.createElement('div');
        pieceElement.classList.add('piece');
        if (index >= 0 && index <= 15) {
            pieceElement.classList.add('black');
        }
        if (index >= 48) {
            pieceElement.classList.add('white');
        }
        pieceElement.textContent = piece;
        const row = Math.floor(index / 8);
        const col = index % 8;
        pieceElement.dataset.row = row; // Save initial row
        pieceElement.dataset.col = col; // Save initial column
        board.children[index].appendChild(pieceElement);
    }
}

document.addEventListener('DOMContentLoaded', () => {

    draw_checkboard();

    let selectedPiece = null;
    let startSquare = null;
    let offsetX, offsetY;

    // Helper function to get Black coordinate values
    function getBlackCoords(clientX, clientY) {
      const boardRect = board.getBoundingClientRect();
      // White coordinates
      const xWhite = clientX - boardRect.left;
      const yWhite = clientY - boardRect.top;
      // Convert to Black coordinates
      const xBlack = boardRect.width - xWhite;
      const yBlack = boardRect.height - yWhite;
      return { xBlack, yBlack, boardRect };
    }

    // Only allow dragging for black pieces.
    document.querySelectorAll('.piece').forEach(piece => {
      if (!piece.classList.contains('black')) return;

      // Mouse events
      piece.addEventListener('mousedown', (e) => {
        selectedPiece = e.target;
        const { xBlack, yBlack, boardRect } = getBlackCoords(e.clientX, e.clientY);
        const pieceRect = selectedPiece.getBoundingClientRect();

        // Get piece's current position in white coordinates:
        const pieceLeftWhite = pieceRect.left - boardRect.left;
        const pieceTopWhite = pieceRect.top - boardRect.top;
        // Convert to Black coordinates:
        const pieceLeftBlack = boardRect.width - pieceLeftWhite - pieceRect.width;
        const pieceTopBlack = boardRect.height - pieceTopWhite - pieceRect.height;

        offsetX = xBlack - pieceLeftBlack;
        offsetY = yBlack - pieceTopBlack;

        startSquare = Array.from(board.children).indexOf(selectedPiece.parentElement);

        selectedPiece.style.position = 'absolute';
        selectedPiece.style.zIndex = 1000;
        selectedPiece.style.width = pieceRect.width + "px";
        selectedPiece.style.height = pieceRect.height + "px";
        selectedPiece.style.left = `${pieceLeftBlack}px`;
        selectedPiece.style.top = `${pieceTopBlack}px`;
      });

      // Touch start event
      piece.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent default scrolling
        selectedPiece = e.target;
        const touch = e.touches[0];
        const { xBlack, yBlack, boardRect } = getBlackCoords(touch.clientX, touch.clientY);
        const pieceRect = selectedPiece.getBoundingClientRect();

        const pieceLeftWhite = pieceRect.left - boardRect.left;
        const pieceTopWhite = pieceRect.top - boardRect.top;
        const pieceLeftBlack = boardRect.width - pieceLeftWhite - pieceRect.width;
        const pieceTopBlack = boardRect.height - pieceTopWhite - pieceRect.height;

        offsetX = xBlack - pieceLeftBlack;
        offsetY = yBlack - pieceTopBlack;

        startSquare = Array.from(board.children).indexOf(selectedPiece.parentElement);

        selectedPiece.style.position = 'absolute';
        selectedPiece.style.zIndex = 1000;
        selectedPiece.style.width = pieceRect.width + "px";
        selectedPiece.style.height = pieceRect.height + "px";
        selectedPiece.style.left = `${pieceLeftBlack}px`;
        selectedPiece.style.top = `${pieceTopBlack}px`;
      });
    });

    // Global mouse move event
    document.addEventListener('mousemove', (e) => {
      if (selectedPiece) {
        const { xBlack, yBlack } = getBlackCoords(e.clientX, e.clientY);
        selectedPiece.style.left = `${xBlack - offsetX}px`;
        selectedPiece.style.top = `${yBlack - offsetY}px`;
      }
    });

    // Global touch move event
    document.addEventListener('touchmove', (e) => {
      if (selectedPiece) {
        e.preventDefault();
        const touch = e.touches[0];
        const { xBlack, yBlack } = getBlackCoords(touch.clientX, touch.clientY);
        selectedPiece.style.left = `${xBlack - offsetX}px`;
        selectedPiece.style.top = `${yBlack - offsetY}px`;
      }
    });

    // Global mouse up event
    document.addEventListener('mouseup', (e) => {
      if (selectedPiece) {
        const { xBlack, yBlack, boardRect } = getBlackCoords(e.clientX, e.clientY);
        const colBlack = Math.floor(xBlack / 60); // assuming each square is 60px
        const rowBlack = Math.floor(yBlack / 60);
        const endSquare_black = rowBlack * 8 + colBlack;

        ws.send(JSON.stringify({
          type: "move",
          startRow: String(Math.floor(startSquare / 8)),
          startCol: String(startSquare % 8),
          endRow: String(Math.floor(endSquare_black / 8)),
          endCol: String(endSquare_black % 8),
          startSquare: startSquare,
          endSquare: endSquare_black,
        }));

        selectedPiece.style.position = 'static';
        selectedPiece.style.left = '';
        selectedPiece.style.top = '';
        selectedPiece = null;
      }
    });

    // Global touch end event
    document.addEventListener('touchend', (e) => {
      if (selectedPiece) {
        // Use changedTouches as no touches remain active
        const touch = e.changedTouches[0];
        const { xBlack, yBlack, boardRect } = getBlackCoords(touch.clientX, touch.clientY);
        const colBlack = Math.floor(xBlack / 60);
        const rowBlack = Math.floor(yBlack / 60);
        const endSquare_black = rowBlack * 8 + colBlack;

        ws.send(JSON.stringify({
          type: "move",
          startRow: String(Math.floor(startSquare / 8)),
          startCol: String(startSquare % 8),
          endRow: String(Math.floor(endSquare_black / 8)),
          endCol: String(endSquare_black % 8),
          startSquare: startSquare,
          endSquare: endSquare_black,
        }));

        selectedPiece.style.position = 'static';
        selectedPiece.style.left = '';
        selectedPiece.style.top = '';
        selectedPiece = null;
      }
    });
  });
  
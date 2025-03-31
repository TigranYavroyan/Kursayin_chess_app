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


// document.addEventListener('DOMContentLoaded', () => {

// 	draw_checkboard();

//     // Make pieces draggable and snap to squares with bounds check
//     let selectedPiece = null;
//     let offsetX, offsetY;
//     let startSquare = null;

//     document.querySelectorAll('.piece').forEach(piece => {
//         if (piece.classList.contains('white'))
//             return ;
//         piece.addEventListener('mousedown', (e) => {
//             selectedPiece = e.target;
//             const pieceRect = selectedPiece.getBoundingClientRect();
//             const boardRect = board.getBoundingClientRect();
    
//             // Calculate offset relative to the board
//             offsetX = e.clientX - pieceRect.left;
//             offsetY = e.clientY - pieceRect.top;
    
//             startSquare = Array.from(board.children).indexOf(selectedPiece.parentElement);
            
//             selectedPiece.style.position = 'absolute';
//             selectedPiece.style.zIndex = 1000;
//             selectedPiece.style.width = pieceRect.width + "px";
//             selectedPiece.style.height = pieceRect.height + "px";
    
//             // Set the piece's position relative to the board
//             selectedPiece.style.left = `${pieceRect.left - boardRect.left}px`;
//             selectedPiece.style.top = `${pieceRect.top - boardRect.top}px`;
//         });

//         document.addEventListener('mousemove', (e) => {
//             if (selectedPiece) {
//                 selectedPiece.style.left = `${e.pageX - offsetX}px`;
//                 selectedPiece.style.top = `${e.pageY - offsetY}px`;
//             }
//         });

//         document.addEventListener('mouseup', (e) => {
//             if (selectedPiece) {
//                 const boardRect = board.getBoundingClientRect();
//                 const x = e.pageX - boardRect.left;
//                 const y = e.pageY - boardRect.top;
// 				const valid_coords = x > 0 && x < 480 && y > 0 && y < 480;
//                 let col = Math.floor(x / 60);
//                 let row = Math.floor(y / 60);

//                 row = 7 - row;
//                 col = 7 - col;
//                 let endSquare = row * 8 + col;
                
//                 console.log(`White: startSquare: ${startSquare}, endSquare: ${endSquare}`);
//                 if (endSquare >= 0 && endSquare < 64 && valid_coords) {
//                     ws.send(JSON.stringify({
//                         "type" : "move",
//                         "startRow" : selectedPiece.dataset.row,
//                         "startCol" : selectedPiece.dataset.col,
//                         "endRow" : String(row),
//                         "endCol" : String(col),
//                         "startSquare" : startSquare,
//                         "endSquare" : endSquare,
//                     }));
//                 }
//                 selectedPiece.style.position = 'static';
//                 selectedPiece = null;
//             }
//         });
//     });
// });

document.addEventListener('DOMContentLoaded', () => {

    draw_checkboard();
  
    let selectedPiece = null;
    let startSquare = null;
    let offsetX, offsetY;
  
    // Only allow dragging for black pieces.
    document.querySelectorAll('.piece').forEach(piece => {
      if (!piece.classList.contains('black')) return;
      
      piece.addEventListener('mousedown', (e) => {
        selectedPiece = e.target;
        const boardRect = board.getBoundingClientRect();
        const pieceRect = selectedPiece.getBoundingClientRect();
  
        // Get mouse coordinates relative to board (white coordinates)
        const xWhite = e.clientX - boardRect.left;
        const yWhite = e.clientY - boardRect.top;
        // Convert to Black's coordinate system (flip horizontally and vertically)
        const xBlack = boardRect.width - xWhite;
        const yBlack = boardRect.height - yWhite;
        
        // Get the piece's current position in white coordinates:
        const pieceLeftWhite = pieceRect.left - boardRect.left;
        const pieceTopWhite = pieceRect.top - boardRect.top;
        // Convert piece position into Black's coordinate system:
        const pieceLeftBlack = boardRect.width - pieceLeftWhite - pieceRect.width;
        const pieceTopBlack = boardRect.height - pieceTopWhite - pieceRect.height;
        
        // Compute the offset between the mouse (in Black coordinates) and the piece's current Black position
        offsetX = xBlack - pieceLeftBlack;
        offsetY = yBlack - pieceTopBlack;
        
        // Save the starting square (DOM order is still in white’s order)
        startSquare = Array.from(board.children).indexOf(selectedPiece.parentElement);
        
        // Set piece to absolute positioning so it can move
        selectedPiece.style.position = 'absolute';
        selectedPiece.style.zIndex = 1000;
        selectedPiece.style.width = pieceRect.width + "px";
        selectedPiece.style.height = pieceRect.height + "px";
        
        // Position the piece at its Black view position
        selectedPiece.style.left = `${pieceLeftBlack}px`;
        selectedPiece.style.top = `${pieceTopBlack}px`;
      });
    });
  
    document.addEventListener('mousemove', (e) => {
      if (selectedPiece) {
        const boardRect = board.getBoundingClientRect();
        // Compute mouse position in white coordinates
        const xWhite = e.clientX - boardRect.left;
        const yWhite = e.clientY - boardRect.top;
        // Convert to Black coordinates:
        const xBlack = boardRect.width - xWhite;
        const yBlack = boardRect.height - yWhite;
        
        // Update piece position so that it remains under the mouse, using our previously computed offset.
        selectedPiece.style.left = `${xBlack - offsetX}px`;
        selectedPiece.style.top = `${yBlack - offsetY}px`;
      }
    });
  
    document.addEventListener('mouseup', (e) => {
      if (selectedPiece) {
        const boardRect = board.getBoundingClientRect();
        // Compute drop coordinates in white space, then convert to Black space.
        const xWhite = e.clientX - boardRect.left;
        const yWhite = e.clientY - boardRect.top;
        const xBlack = boardRect.width - xWhite;
        const yBlack = boardRect.height - yWhite;
        
        // Determine the dropped square in Black coordinates.
        const colBlack = Math.floor(xBlack / 60);
        const rowBlack = Math.floor(yBlack / 60);
        const endSquare_black = rowBlack * 8 + colBlack;
        
        // Send move data using white's coordinate system.
        ws.send(JSON.stringify({
          type: "move",
          startRow: String(Math.floor(startSquare / 8)),
          startCol: String(startSquare % 8),
          endRow: String(Math.floor(endSquare_black / 8)),
          endCol: String(endSquare_black % 8),
          startSquare: startSquare,
          endSquare: endSquare_black,
        }));
        
        // Reset piece positioning (let CSS place it back via static layout)
        selectedPiece.style.position = 'static';
        selectedPiece.style.left = '';
        selectedPiece.style.top = '';
        selectedPiece = null;
      }
    });
  });
  
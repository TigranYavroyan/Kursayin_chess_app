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
        window.location.href = data.redirectUrl;
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
        else if (index >= 48) {
            pieceElement.classList.add('white');
        }
        pieceElement.textContent = piece;
        const row = Math.floor(index / 8);
        const col = index % 8;
        pieceElement.dataset.row = row;
        pieceElement.dataset.col = col;
        board.children[index].appendChild(pieceElement);
    }
}

document.addEventListener('DOMContentLoaded', () => {

	draw_checkboard();

   
    let selectedPiece = null;
    let offsetX, offsetY;
    let startSquare = null;

    document.querySelectorAll('.piece').forEach(piece => {
        if (piece.classList.contains('black'))
            return ;
        piece.addEventListener('mousedown', (e) => {
            selectedPiece = e.target;
            offsetX = e.offsetX;
            offsetY = e.offsetY;
            startSquare = Array.from(board.children).indexOf(selectedPiece.parentElement);
            selectedPiece.style.position = 'absolute';
            selectedPiece.style.zIndex = 1000;
        });

        document.addEventListener('mousemove', (e) => {
            if (selectedPiece) {
                selectedPiece.style.left = `${e.pageX - offsetX}px`;
                selectedPiece.style.top = `${e.pageY - offsetY}px`;
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (selectedPiece) {
                const boardRect = board.getBoundingClientRect();
                const x = e.pageX - boardRect.left;
                const y = e.pageY - boardRect.top;
				const valid_coords = x > 0 && x < 480 && y > 0 && y < 480;
                const col = Math.floor(x / 60);
                const row = Math.floor(y / 60);
                const endSquare = row * 8 + col;
                if (endSquare >= 0 && endSquare < 64 && valid_coords) {
                    ws.send(JSON.stringify({
                        "type" : "move",
                        "startRow" : selectedPiece.dataset.row,
                        "startCol" : selectedPiece.dataset.col,
                        "endRow" : String(row),
                        "endCol" : String(col),
                        "startSquare" : startSquare,
                        "endSquare" : endSquare,
                    }));
                }
                selectedPiece.style.position = 'static';
                selectedPiece = null;
            }
        });

       
        piece.addEventListener('touchstart', (e) => {
            e.preventDefault();
            selectedPiece = e.target;
            let touch = e.touches[0];
            let rect = selectedPiece.getBoundingClientRect();
           
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
            startSquare = Array.from(board.children).indexOf(selectedPiece.parentElement);
            selectedPiece.style.position = 'absolute';
            selectedPiece.style.zIndex = 1000;
        });

        document.addEventListener('touchmove', (e) => {
            if (selectedPiece) {
                e.preventDefault();
                let touch = e.touches[0];
                selectedPiece.style.left = `${touch.pageX - offsetX}px`;
                selectedPiece.style.top = `${touch.pageY - offsetY}px`;
            }
        });

        document.addEventListener('touchend', (e) => {
            if (selectedPiece) {
                const boardRect = board.getBoundingClientRect();
               
                let touch = e.changedTouches[0];
                const x = touch.pageX - boardRect.left;
                const y = touch.pageY - boardRect.top;
                const valid_coords = x > 0 && x < boardRect.width && y > 0 && y < boardRect.height;
                const col = Math.floor(x / (boardRect.width / 8));
                const row = Math.floor(y / (boardRect.height / 8));
                const endSquare = row * 8 + col;
                if (endSquare >= 0 && endSquare < 64 && valid_coords) {
                    ws.send(JSON.stringify({
                        type: "move",
                        startRow: selectedPiece.dataset.row,
                        startCol: selectedPiece.dataset.col,
                        endRow: String(row),
                        endCol: String(col),
                        startSquare: startSquare,
                        endSquare: endSquare,
                    }));
                }
                selectedPiece.style.position = 'static';
                selectedPiece = null;
            }
        });

    });
});
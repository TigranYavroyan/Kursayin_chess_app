import { app, wss } from "./app.js";
import { spawn } from "child_process";
import { validateUserCount } from "./utils/validateUserCount.js";
import { messaging, userDisconnect } from "./utils/wsHelpers.js";

const engine_name = './Checkmate_CPP/chess_engine';
const chessEngine = spawn(engine_name);
let session_starts = false;

chessEngine.on('close', (code) => {
	console.log(`Chess engine exited with code ${code}`);
	chessEngine.stdin.end();
});

app.ws("/", (ws) => {
	validateUserCount(wss.clients.size, ws)
	console.log("Someone connected...");
	if (wss.clients.size === 1) {
		ws.send(JSON.stringify({
			type: "role_assignment",
			redirectUrl: "/white.html",
		}));

		ws.send(JSON.stringify({
			type: "wait_player",
			message: "Please, wait second player to connect"
		}));
	}
	else if (wss.clients.size === 2) {
		ws.send(JSON.stringify({
			type: "role_assignment",
			redirectUrl: "/black.html",
		}));

		wss.clients.forEach((client) => {
			client.send(JSON.stringify({
				type: "start_game",
				message: "The second player connected, you can start"
			}));
		});
	} 

	ws.on('close', () => {
		if (wss.clients.size < 2)
			userDisconnect({ session_starts, wss });
		console.log("Someone disconnected...");
	});
	ws.on("message", (data) => {
		const message = JSON.parse(data);
		console.log("Data from front:", message);
		if (message.type === "meta")
			session_starts = message.session_starts;
		else
			messaging(message, chessEngine);
	});
});
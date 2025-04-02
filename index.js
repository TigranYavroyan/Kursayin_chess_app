import { app, wss } from "./app.js";
import { spawn } from "child_process";
import { validateUserCount } from "./utils/validateUserCount.js";
import { messaging, userConnection, userDisconnect } from "./utils/wsHelpers.js";

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
	userConnection({wss, ws});

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
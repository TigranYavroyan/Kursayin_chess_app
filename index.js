import { app, wss } from "./app.js";
import { spawn } from "child_process";
import { validateUserCount } from "./utils/validateUserCount.js";
import { messaging, userDisconnect } from "./utils/wsHelpers.js";

const engine_name = './Checkmate_CPP/chess_engine';
const chessEngine = spawn(engine_name);
let userCount = 0;
let session_starts = false;

chessEngine.on('close', (code) => {
	console.log(`Chess engine exited with code ${code}`);
	chessEngine.stdin.end();
});

app.ws("/", (ws) => {
	++userCount;

	validateUserCount(userCount, ws)
	if (userCount === 1) {
		ws.send(JSON.stringify({
			type: "role_assignment",
			redirectUrl: "/white.html",
		}));
	}
	else if (userCount === 2) {
		ws.send(JSON.stringify({
			type: "role_assignment",
			redirectUrl: "/black.html",
		}));
	} 


	console.log("Someone connected...");
	ws.on('close', () => {
		--userCount;
		if (userCount < 2)
			userDisconnect({ session_starts, wss, userCount });
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
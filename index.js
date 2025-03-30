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

	console.log("Someone connected...");
	ws.on('close', () => {
		--userCount;
		userDisconnect({ session_starts, wss, userCount });
	});
	ws.on("message", (data) => {
		const message = JSON.parse(data);
		if (message.type === "meta")
			session_starts = message.session_starts;
		else
			messaging(message, chessEngine);
	});
});
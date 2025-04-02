import { wss } from "../app.js";
import { moveParse } from "../engine_helpers/moveParse.js";

export function send_all_clients_json (ob) {
	wss.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(ob));
		}
	});
}

export function userDisconnect ({session_starts, wss}) {
	if (session_starts) {
		wss.clients.forEach((client) => {
			if (client.readyState === client.OPEN) {
				client.send(JSON.stringify({
					type: "session_end",
					message: "The other player left",
					redirectUrl: "/end"
				}));
				client.close();
			}
		});
		console.log("Server is closed");
		process.exit(1);
	}
}

export function messaging (message, chessEngine) {
	try {
		if (message.type === "move") {
			chessEngine.stdin.write(JSON.stringify(message) + '\n');
			chessEngine.stdout.once('data', (data) => {
				moveParse(data, message);
			});
		}
		else {
			console.log("Answer from client is wrong");
		}
	}
	catch (err) {
		console.error("There is error: ", err);
	}
}

export function userConnection ({wss, ws}) {
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
}
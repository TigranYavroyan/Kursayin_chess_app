import { send_all_clients_json } from "../utils/wsHelpers.js";

export const moveParse = function(data, message) {
	try {
		data = JSON.parse(data.toString("utf-8"));
		if (data["game_end"] === "true") {
			game_end = true;
			send_all_clients_json({
				"type" : "game_over",
				"message" : "The game has ended. Thanks for playing!"
			});
		}
		if (data["valid"] === "true") {
			if (data["state"] === "castling") {
				send_all_clients_json({
					"type" : "update_board",
					"move_state" : "castling",
					"startSquare" : message.startSquare,
					"endSquare" : message.endSquare,
					"rockStart" : data.rockStart,
					"rockEnd" : data.rockEnd
				});
			}
			else {
				send_all_clients_json({
					"type" : "update_board",
					"startSquare" : message.startSquare,
					"endSquare" : message.endSquare
				});
			}
		}
		else if (data["valid"] === "false") {

		}
		console.log("Engine Response:", data);
	} catch (err) {
		console.error("Invalid JSON response:", data, err.message);
	}
}
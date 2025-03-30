export function validateUserCount (userCount, ws) {
	if (userCount > 2) {
		ws.send(JSON.stringify({
			type: "full_server",
			message: "Server is full. Please try again later.",
			redirectUrl: "/full_server"
		}));
		ws.close();
		return;
	}
}
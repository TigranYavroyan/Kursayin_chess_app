import express from "express";
import "dotenv/config";
import expressWs from "express-ws";

const app = express();
const ws = expressWs(app);
const wss = ws.getWss();

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static("public"));

app.get("/config.js", (req, res) => {
	res.type("application/javascript");
	res.send(`window.config = { backendPort: ${PORT} };`);
});

app.get('/full_server', (req, res) => {
	res.sendFile(process.cwd() + '/public/full_server.html');
});

app.get('/end', (req, res) => {
	res.sendFile(process.cwd() + '/public/end.html');
});

app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}...`);
});

export {
	app,
	wss	
}
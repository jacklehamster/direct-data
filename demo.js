const express 	= require('express');
const serve   	= require('express-static');
const fs 		= require('fs');
const { ServerHandler } = require("./src/server-handler");

const PORT = 3000;

const app = express();

app.get('/', (req, res, next) => {
	res.writeHead(200, {'Content-Type': 'text/html'});
	fs.promises.readFile(`${__dirname}/index.html`).then(html => {
		res.write(html);
		res.end();
	});
});

new ServerHandler(app, false, "demo/data", "/demo");

app.use(serve(`${__dirname}`));



const server = app.listen(PORT, () => {
	console.log('Demo running at %s', PORT);
});

var http = require('http');
var fs = require('fs');
var pathutil = require('path');

var WebSocketServer = require('ws').Server;

require('./lib/array.js');

var mime = { 'html': 'text/html', 'pdf': 'application/pdf' };

var hs = new http.Server();

hs.on( 'request', function( request, response ) {
	if( request.method === 'GET' ) {
		if( request.url === '/' ) {
			request.url = '/index.html';
		}

		console.log( 'getting ' + request.url );

		var name = pathutil.basename( request.url ), path = 'resources' + request.url;

		if( pathutil.existsSync( path ) ) {
			if( fs.statSync( path ).isDirectory() ) {
				// directory
			}
			else {
				var contents = fs.readFileSync( path );

				response.writeHead( 200, {
					'Content-Type': mime[ name.split('.').last ] || 'text/plain',
					'Content-Length': contents.length
				});

				response.end( contents );
			}
		}
		else {
			response.writeHead( 404 );
			response.end();
		}
	}
	else {
		// not GET
	}	
});

var wss = new WebSocketServer({ server: hs });

wss.on( 'connection', function( ws ) {
	ws.on( 'message', function( message ) {
		this.send( message );
	});
});

hs.listen( 8000, function() {
	console.log( 'Listening on 127.0.0.1:8000' );
});

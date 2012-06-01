var http = require('http');
var fs = require('fs');
var pa = require('path');

var WebSocket = require( './lib/websocket.js' ).WebSocket;

require('./lib/array.js');

var mime = { 'html': 'text/html', 'pdf': 'application/pdf' };

var server = new http.Server();

server.on( 'request', function( request, response ) {
	if( request.method === 'GET' ) {
		if( request.url === '/' ) {
			request.url = '/index.html';
		}

		console.log( 'getting ' + request.url );

		var name = pa.basename( request.url ), path = 'resources' + request.url;

		if( pa.existsSync( path ) ) {
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

server.on( 'upgrade', function( request, socket, head ) {
	WebSocket.create( socket, request.headers );

	socket.on( 'message', function( message ) {
		this.send( message );
	});

});

server.listen( 8000, '127.0.0.1', function() {
	console.log( "Listening on 127.0.0.1:8000" );
});

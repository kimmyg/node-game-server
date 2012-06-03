var http = require('http');
var ws = require('ws');

var login = require( './login.js' );
var main = require( './main.js' );

//var pool = new require( './pool.js' ).Pool();

var hs = new http.Server();

hs.on( 'request', function( request, response ) {
	if( request.headers.cookie ) {
		// test cookie
		// if logged in
			main.handle.call( this, request, response );
		// else
			//login
	}
	else {
		login.handle.call( this, request, response );
	}
});

var wss = new ws.Server({ server: hs });

wss.on( 'connection', function( ws ) {
	ws.on( 'message', function( message ) {
		this.send( message );
	});
});

hs.listen( 8000, function() {
	console.log( 'Listening on 127.0.0.1:8000' );
});

var fs = require('fs');
var http = require('http');
var ws = require('ws');
var url = require('url');

var redirect = require( './redirect.js' ).redirect;

var cookie = require( './cookie.js' );
var login = require( './login.js' );
var main = require( './main.js' );
var game = require( './game.js' );

var hs = new http.Server();

hs.on( 'request', function( request, response ) {
	if( request.headers.cookie ) {
		var info = cookie.parse( request.headers.cookie );
		
		if( info.name && info.token ) {
			info = { 'name': info.name, 'token': info.token };
		
			if( login.tokenIsValid( info.name, info.token ) ) {
				var components = url.parse( request.url ).pathname.split( '/' );
				
				if( components.length > 1 ) { // there is a slash
					if( components[0] === '' ) {
						if( components[1] === '' ) {
							main.handle.call( this, info, response );
						}
						else {
							fs.stat( 'games/' + components[1], function( error, stats ) {
								if( error ) {
									redirect( response, '/' );
								}
								else {
									game.handle.call( this, info, components.slice( 1 ), response );
								}
							});
						}
					}
					else {
						redirect( response, '/' );
					}
				}
				else {
					redirect( response, '/' );
				}
			}
			else {
				// invalid token
				// message then redirect?
				login.handle.call( this, request, response );
			}
		}
		else {
			// no name or no token
			// message then redirect?
			login.handle.call( this, request, response );
		}
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

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
		
		if( info.expiration && info.name && info.token ) {
			info = { 'expiration': info.expiration, 'name': info.name, 'token': info.token };
		
			if( login.tokenIsValid( info.expiration, info.name, info.token ) ) {
				var components = url.parse( request.url ).pathname.split( '/' ).slice( 1 );
				
				if( components[0] === '' ) {
					main.handle.call( this, info, response );
				}
				else if( components[0] === 'style.css' ) {
					fs.readFile( 'style.css', 'utf8', function( error, data ) {
						if( error ) {
							response.writeHead( 500 );
							response.end();
						}
						else {
							response.writeHead( 200, { 'Content-Type': 'text/css' } );
							response.end( data );
						}
					});
				}
				else {
					fs.stat( 'games/' + components[0], function( error, stats ) {
						if( error ) {
							redirect( response, '/' );
						}
						else {
							game.handle.call( this, info, components, response );
						}
					});
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
	var request = ws.upgradeReq;
	
	if( request.headers.cookie ) {
		var info = cookie.parse( request.headers.cookie );
		
		if( info.expiration && info.name && info.token ) {
			info = { 'expiration': info.expiration, 'name': info.name, 'token': info.token };
		
			if( login.tokenIsValid( info.expiration, info.name, info.token ) ) {
				var components = url.parse( request.url ).pathname.split( '/' ).slice( 1 );
				
				fs.stat( 'games/' + components[0], function( error, stats ) {
					if( error ) {
						ws.close();
					}
					else {
						game.handleWS.call( this, info, components, ws );
					}
				});
			}
			else {
				ws.close();
			}
		}
		else {
			ws.close();
		}
	}
	else {
		ws.close();
	}
});

hs.listen( 8000, function() {
	console.log( 'Listening on 127.0.0.1:8000' );
});

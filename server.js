var cookie = require('cookie');
var fs = require('fs');
var http = require('http');
var mime = require('mime');
var redirect = require('redirect').redirect;
var url = require('url');
var ws = require('ws');

var login = require( './login.js' );
var main = require( './main.js' );
var game = require( './game.js' );

var hs = new http.Server();

/*
/ - main page
/<asset> - deliver asset
/<game> - redirect to /<game>/
/<game>/lobby - game page
/<game>/new - make game, redirect to /<game>/<game-id>/
/<game>/<asset> - deliver asset
*/

hs.on( 'request', function( request, response ) {
	var self = this;

	login.handle( request, response, function( info ) {
		var pathname = url.parse( request.url ).pathname;

		if( pathname.substring( 0, 1 ) === '/' ) {
			var components = pathname.split( '/' ).slice( 1 );

			if( components[0] === '' ) {
				if( components.length === 1 ) {
					main.handle( response, info );
				}
				else {
					// some problem here
				}
			}
			else {
				fs.stat( 'games/' + components[0], function( error, stats ) {
					if( error ) {
						var filepath = 'resources/' + components.join( '/' );
						
						fs.stat( filepath, function( error, stats ) {
							if( error ) {
								response.writeHead( 404 );
								response.end();
							}
							else {
								fs.readFile( filepath, 'utf8', function( error, data ) {
									if( error ) {
										response.writeHead( 500 );
										response.end();
									}
									else {
										response.writeHead( 200, { 'Content-Type': mime.typeForPath( filepath ) } );
										response.end( data );
									}
								});
							}
						});
					}
					else {
						if( components.length === 1 ) {
							redirect( response, '/' + components[0] + '/' );
						}
						else {
							game.handle( response, info, components );
						}
					}
				});
			}
		}
		else {
			console.log( 'no slash? this is weird.' );
			redirect( response, '/' + pathname );
		}
	});
});

var wss = new ws.Server({ server: hs });

wss.on( 'connection', function( ws ) {
	var request = ws.upgradeReq;

	login.check( request, function( info ) {
		var components = url.parse( request.url ).pathname.split( '/' ).slice( 1 );
				
		fs.stat( 'games/' + components[0], function( error, stats ) {
			if( error ) {
				ws.close();
			}
			else {
				game.handleWS( ws, info, components );
			}
		});
	}, function( error ) {
		console.log( error );
		ws.close();
	});
});

if( process.argv.length < 3 ) {
	console.log( 'usage: ' + process.argv.join( ' ' ) + ' <port>' );
}
else {
	var port = parseInt( process.argv[2] );

	if( port && port >= 0 && port < 65536 ) {
		hs.listen( port, function() {
			console.log( 'Listening on 127.0.0.1:' + port );
		});
	}
	else {
		console.log( process.argv[2] + ' is not a valid port' );
	}
}


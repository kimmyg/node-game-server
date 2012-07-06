var fs = require('fs');
var http = require('http');
var ws = require('ws');
var url = require('url');

var redirect = require('redirect').redirect;
var cookie = require('cookie');

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



	login.check( request, function( info ) {
		var pathname = url.parse( request.url ).pathname;

		if( pathname.substring( 0, 1 ) === '/' ) {
			var components = pathname.split( '/' ).slice( 1 );

			if( components.length === 1 ) {
				if( components[0] === '' ) {
					main.handle.call( this, response, info );
				}
				else {
					fs.stat( components[0], function( error, stats ) {
						if( error ) {
							fs.stat( 'games/' + components[0], function( error, stats ) {
								if( error ) {
									response.writeHead( 404 );
									response.end();
								}
								else {
									redirect( response, '/' + components.join( '/' ) + '/' );
								}
							});
						}
						else {
							fs.readFile( components[0], 'utf8', function( error, data ) {
								if( error ) {
									response.writeHead( 500 );
									response.end();
								}
								else {
									response.writeHead( 200, { 'Content-Type': contentTypeForPath( components[0] ) } );
									response.end( data );
								}
							});
						}
					});								
				}
			}
			else {
				var self = this;

				fs.stat( 'games/' + components[0], function( error, stats ) {
					if( error ) {
						response.writeHead( 404 );
						response.end();	
					}
					else {
						game.handle.call( self, response, info, components );
					}
				});
			}
		}
		else {
			redirect( response, '/' + pathname );
		}
	}, function( error ) {
		console.log( error );
		login.perform( request, response );
	});
});

var wss = new ws.Server({ server: hs });

wss.on( 'connection', function( ws ) {
	var self = this;

	login.check( ws.upgradeReq, function( info ) {
		var components = url.parse( request.url ).pathname.split( '/' ).slice( 1 );
				
		fs.stat( 'games/' + components[0], function( error, stats ) {
			if( error ) {
				ws.close();
			}
			else {
				game.handleWS.call( this, info, components, ws );
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


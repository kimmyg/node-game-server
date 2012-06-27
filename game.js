var fs = require('fs');
var util = require('util');

var redirect = require('redirect').redirect;

exports.handle = function( response, user_info, parameters ) {
	var game_module = require( './games/' + parameters[0] );
	
	if( parameters.length > 2 ) {
		redirect( response, '/' + parameters[0] + '/' );
	}
	else {
		if( parameters[1] === '' ) {
			// game.html should be parameterized somehow
		
			fs.readFile( 'game.html', 'utf8', function( error, data ) {
				if( error ) {
					redirect( response, '/', 'could not load game.html' );
				}
				else {
					response.writeHead( 200, { 'Content-Type': 'text/html' } );
					response.end( data );
				}
			});
		}
		else if( parameters[1] === 'new' ) {
			var id = game_module.createGathering( user_info.name );
			redirect( response, '/' + parameters[0] + '/' + id + '/' );
		}
		else {
			var resource_path = 'games/' + parameters[0] + 'resources/' + parameters[1];

			fs.stat( resource_path, function( error, stats ) {
				if( error ) {
					if( game_module.playerCanJoin( parameters[1], user_info.name ) ) {
						fs.readFile( 'games/' + parameters[0] + '/' + game_module.assetForId( parameters[1] ), 'utf8', function( error, data ) {
							if( error ) {
								redirect( response, '/', 'could not load games/' + parameters[0] + 'gather.html' );
							}
							else {
								response.writeHead( 200, { 'Content-Type': 'text/html' } );
								response.end( data );
							}
						});
					}
					else {
						redirect( response, '/' + parameters[0], 'there is no game with id ' + parameters[1] );
					}

					// since the game was displayed, it must be resumable (else it would 
					// disappear immediately), the player must be in it (else it wouldn't 
					// be displayed), and the player must not be connected (we could 
					// stipulate that we only display games the player is a part of and 
					// not connected to...)
				}
				else {
					fs.readFile( resource_path, 'utf8', function( error, data ) {
						if( error ) {
							response.writeHead( 500 );
							response.end();
						}
						else {
							response.writeHead( 200, { 'Content-Type': mime.typeForPath( resource_path ) } );
							response.end( data );
						}
					});
				}
			});
		}
	}
}

exports.handleWS = function( user_info, parameters, ws ) {
	var manager = require( './games/' + parameters[0] );

	if( parameters.length > 1 ) {
		if( manager.playerCanJoin( parameters[1], user_info.name ) ) {
			manager.join( parameters[1], ws, user_info.name );
		}
		else {
			ws.close();
		}
	}
	else {
		manager.watch( ws );
	}
}

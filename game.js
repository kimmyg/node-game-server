var fs = require('fs');
var mime = require('mime');
var redirect = require('redirect').redirect;
var util = require('util');

exports.handle = function( response, user_info, parameters ) { // parameters contains [<game>,...]
	var game_module = require( './games/' + parameters[0] );
	
	if( parameters[1] === '' ) {
		fs.readFile( 'resources/game.html', 'utf8', function( error, data ) {
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
		redirect( response, '/' + parameters[0] + '/' + id );
	}
	else {
		var resource_path = 'resources/' + parameters[1];
	
		fs.stat( resource_path, function( error, stats ) {
			if( error ) {
				if( game_module.gatheringOrGameExistsWithId( parameters[1] ) ) {
					if( game_module.playerCanJoin( parameters[1], user_info.name ) ) {
						var game_resource_path = 'games/' + parameters[0] + '/resources/' + game_module.assetForId( parameters[1] );
			
						fs.readFile( game_resource_path, 'utf8', function( error, data ) {
							if( error ) {
								redirect( response, '/' + parameters[0] + '/', 'could not load ' + game_resource_path );
							}
							else {
								response.writeHead( 200, { 'Content-Type': 'text/html' } );
								response.end( data );
							}
						});
					}
					else {
						redirect( response, '/' + parameters[0] + '/', 'you are not allowed to join game with id ' + parameters[1] );
					}

				}
				else {
					redirect( response, '/' + parameters[0] + '/', 'no game with id ' + parameters[1] );
				}
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
	
	
				

/*	else {
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
}*/

exports.handleWS = function( ws, user_info, parameters ) {
	var manager = require( './games/' + parameters[0] );

	if( parameters[1] === '' ) {
		manager.watch( ws );
	}
	else {
		if( manager.playerCanJoin( parameters[1], user_info.name ) ) {
			manager.join( parameters[1], ws, user_info.name );
		}
		else {
			ws.close();
		}
	}
}

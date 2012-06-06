var util = require('util');

var redirect = require( './redirect.js' ).redirect;

var fs = require('fs');

exports.handle = function( user_info, parameters, response ) {
	var game_module = require( './games/' + parameters[0] );
	
	if( parameters.length > 1 ) {
		if( parameters.length > 2 ) {
			redirect( response, '/' + parameters[0] );
		}
		else {
			if( parameters[1] === 'new' ) {
				var id = game_module.createGathering( user_info.name );
				redirect( response, '/' + parameters[0] + '/' + id );
			}
			else {
				if( game_module.playerCanJoinWithId( user_info.name, parameters[1] ) ) {
					fs.readFile( 'games/' + parameters[0] + '/gather.html', 'utf8', function( error, data ) {
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
		}
	}
	else {
		/*game_module.games.filter( function( game ) {
			return game.includesPlayer( user_info.name );
		}).map( function( game ) {
			return '<a href="/' + parameters[0] + '/' + game.id + '">' + game.id + '</a>';
		});*/
		
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
}

exports.handleWS = function( user_info, parameters, ws ) {
	var manager = require( './games/' + parameters[0] );

	if( parameters.length > 1 ) {
		if( manager.playerCanJoinWithId( user_info.name, parameters[1] ) ) {
			manager.joinGathering( ws, parameters[1], user_info.name );
		}
		else {
			ws.close();
		}
	}
	else {
		manager.watchGatherings( ws );
	}
}

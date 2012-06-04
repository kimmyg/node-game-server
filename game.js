var util = require('util');

var redirect = require( './redirect.js' ).redirect;

exports.handle = function( user_info, parameters, response ) {
	var game_module = require( './games/' + parameters[0] );
	
	if( parameters.length > 1 ) {
		if( parameters.length > 2 ) {
			redirect( response, '/' + parameters[0] );
		}
		else {
			if( parameters[1] === 'new' ) {
				var game_id = game_module.createGathering( user_info.name );
				// create a new game and redirect to its gathering
			}
			else {
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
		
		response.writeHead( 200, { 'Content-Type': 'text/plain' } );
		response.end( 'list of games for ' + user_info.name );
	}
}

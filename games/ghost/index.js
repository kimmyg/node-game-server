/*

when a player visits the root of a game page, they will register as a watcher
of the joinable games (can both appear and disappear) and gatherings (as well
as information about them--who created, players joining and leaving them, etc.)
when the connection is severed, perhaps by going to another page, they are auto-
matically removed from listening.

the game page is common to all games. we may wish to make custom events or 
information available about gatherings, etc. if so, we will find a way to 
do it. until then, it is common.

some options should be able to be made before a gathering is created, such 
as the maximum number of people. some options should be available as the 
gathering occurs. (these may overlap.) for now, we make things simple: 
options are exposed on the game-specific gather page.

when a player creates a game, it should not appear until they have loaded 
and joined it. for now, we will let these go since they probably won't 
accumulate. in the future, we should create a timeout after which the 
game is destroyed.

when a player joins a gathering, they are registered for arbitrary updates. 
this is all handled by the gathering object, and the custom gathering page 
to interpret them.

gatherings cannot be cancelled. if the creator leaves, the player who joined 
first takes the creator role, and is in charge of options, etc. if no players 
are left, the game is destroyed.

after the game is initiated, it is suspended until all the players connect. 
at the expiration of some timeout, other players can vote to drop that player. 
this shouldn't pose a problem in general as the game itself should not be 
created until all players are ready. some team games may make this problematic.

when a player goes to /<game>, the common game page is served, the <game> module 
is loaded and they register to watch for games and gatherings.

when a player goes to /<game>/<id>, the custom gather page is served, the <game> 
module is loaded and the player is added to gathering <id>

when a player goes to /<game>/new, a gathering is created (and creator noted) and 
put in a waiting pool. when the creator connects, the game is added to the joinable 
gatherings and broadcast.

loading pages need to know if a given player can join a game or gathering with a 
particular id. this suggests an interface like

manager.playerCanJoinWithId( 'test', 'aabbccdd' )

*/

// list of joinable games (joinable will be refined)
// list of gatherings (should be joinable)

var EventEmitter = require('events').EventEmitter;

require('object');

var game = require( './definition.js' );

var in_waiting = {}; // games go here when just created, moved to gatherings and broadcasted when the creator joins
var gatherings = {};
var games = {};

var emitter = new EventEmitter();

exports.watch = function( ws ) {
	var add_gatheringCB = function( id, creator ) {
		ws.send( JSON.stringify({ type: 'add_gathering', id: id, name: creator }) );
	};
	
	var add_gameCB = function( id, creator ) {
		ws.send( JSON.stringify({ type: 'add_game', id: id, name: creator }) );
	};

	var removeCB = function( id ) {
		ws.send( JSON.stringify({ type: 'remove', id: id }) );
	};
	
	var renameCB = function( id, name ) {
		ws.send( JSON.stringify({ type: 'rename', id: id, name: name }) );
	};

	emitter.addListener( 'add_gathering', add_gatheringCB );
	emitter.addListener( 'add_game', add_gameCB );
	emitter.addListener( 'remove', removeCB );
	emitter.addListener( 'rename', renameCB );

	ws.on( 'close', function() {
		emitter.removeListener( 'add_gathering', add_gatheringCB );
		emitter.removeListener( 'add_game', add_gameCB );
		emitter.removeListener( 'remove', removeCB );
		emitter.removeListener( 'rename', renameCB );
	});

	gatherings.eachValue( function( gathering ) {
		ws.send( JSON.stringify({ type: 'add_gathering', id: gathering.id, name: gathering.creator }) );
	});
	
	games.eachValue( function( game ) {
		ws.send( JSON.stringify({ type: 'add_game', id: game.id, name: game.creator }) );
	});
}

// gathering events:
// create( id, creator )
// remove( id )
// new_creator( id, creator )
// empty()

exports.join = function( id, ws, player_name ) {
	if( in_waiting.hasOwnProperty( id ) ) {
		var gathering = in_waiting[ id ];
	
		delete in_waiting[ id ];
		
		gathering.join( ws, player_name );
			
		gatherings[ id ] = gathering;
		
		emitter.emit( 'add_gathering', gathering.id, gathering.creator );
		
		gathering.on( 'empty', function() {
			delete gatherings[ id ];
			emitter.emit( 'remove', id );
		});
		
		gathering.on( 'new_creator', function( id, creator ) {
			emitter.emit( 'rename', id, creator );
		});

		gathering.on( 'request_start', function( id ) {
			var game = gathering.createGame();
			
			game.on( 'request_end', function() {
				delete games[ id ];
			
				this.endGame();
			});
			
			delete gatherings[ id ];
			games[ id ] = game;
			
			gathering.startGame();
			
			emitter.emit( 'remove', id );
			emitter.emit( 'add_game', game.id, game.creator );
		});
	}
	else if( gatherings.hasOwnProperty( id ) ) {
		gatherings[ id ].join( ws, player_name );
	}
	else if( games.hasOwnProperty( id ) ) {
		games[ id ].join( ws, player_name );
	}
	else {
		console.log( 'whoa, rogue id: ' + id );
	}
}

var getUnusedId = function() {
	var id = (Math.random() * 65536 * 65536).toString( 16 );

	while( in_waiting.hasOwnProperty( id ) || gatherings.hasOwnProperty( id ) || games.hasOwnProperty( id ) ) {
		id = (Math.random() * 65536 * 65536).toString( 16 );
	}
	
	return id;
}

exports.createGathering = function( creator ) {
	var id = getUnusedId();

	in_waiting[ id ] = new game.Gathering( id, creator );
	
	return id;
}

exports.gatheringOrGameExistsWithId = function( id ) {
	return ( in_waiting.hasOwnProperty( id ) || gatherings.hasOwnProperty( id ) || games.hasOwnProperty( id ) );
}

exports.playerCanJoin = function( id, player_name ) {
	return ( ( in_waiting.hasOwnProperty( id ) && in_waiting[ id ].creator === player_name ) || gatherings.hasOwnProperty( id ) || ( games.hasOwnProperty( id ) && games[ id ].isPlayer( player_name ) ) );
}

exports.assetForId = function( id ) {
	if( in_waiting.hasOwnProperty( id ) || gatherings.hasOwnProperty( id ) ) {
		return 'gather.html';
	}
	else if( games.hasOwnProperty( id ) ) {
		return 'game.html';
	}
	else throw new Error( 'no asset for id ' + id );
}

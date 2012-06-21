var util = require('util');

var EventEmitter = require('events').EventEmitter;
var Map = require( '../../lib/map.js' ).Map;

require( '../../lib/object.js' );

function Gathering( id, creator ) {
	EventEmitter.call( this );
	
	this.id = id;
	this.creator = creator;
	
	this.order = [];
	this.connections = new Map();
	this.players = new Map();
}

util.inherits( Gathering, EventEmitter );

Gathering.prototype.join = function( ws, player_name ) {
	var self = this;

	ws.on( 'message', function( data ) {
		self.handle( ws, data );
	});

	if( this.order.length === 0 ) {
		ws.send( JSON.stringify({ type: 'creator' }) );
	}

	ws.send( JSON.stringify({ type: 'players', players: this.order }) );
	
	this.order.push( player_name );
	this.connections.set( ws, player_name );
	this.players.set( player_name, ws );
		
	this.broadcast( JSON.stringify({ type: 'add', name: player_name }) );
}

Gathering.prototype.part = function( ws ) {
	var player_name = this.connections.get( ws ), index = this.indexForPlayerName( player_name );
	
	this.order.splice( index, 1 );
	this.connections.delete( ws );
	this.players.delete( player_name );
		
	this.broadcast( JSON.stringify({ type: 'remove', name: player_name }) );
		
	if( this.order.length === 0 ) {
		this.emit( 'empty' );
	}
	else if( index === 0 ) {
		this.creator = this.order[0];
			
		this.emit( 'new_creator', this.creator );
		this.players.get( this.creator ).send( JSON.stringify({ type: 'creator' }) );
	}
}

Gathering.prototype.indexForPlayerName = function( player_name ) {
	for( var i = 0; i < this.order.length; ++i ) {
		if( this.order[i] === player_name ) {
			return i;
		}
	}
}

Gathering.prototype.broadcast = function( message ) {
	this.connections.eachKey( function( ws ) {
		ws.send( message );
	});
}

Gathering.prototype.handle = function( ws, message ) {
	var sender = this.connections.get( ws ), message = JSON.parse( message );

	if( message.type === 'start' ) {
		if( sender === this.creator ) {
			console.log( 'emitting start' );
			this.emit( 'start', this.id );

			// emit a start and do the next line in the callback?
			// this.broadcast( JSON.stringify({ type: 'start' }) );
			// this is interpreted on the client side as a redirect or a refresh or something
		}
		else {
			// must be the creator to start the game
		}
	}
	else if( message.type === 'chat' ) {
		this.broadcast( JSON.stringify({ type: 'chat', sender: sender, message: message.message }) );
	}
	else {
		console.log( 'unrecognized message type ' + message.type );
	}
}

Gathering.prototype.createGame = function() {
	return new NetworkInterface( this.id, this.creator, this.order );
}

Gathering.prototype.startGame = function() {
	this.broadcast( JSON.stringify({ type: 'start' }) );
}

exports.Gathering = Gathering;


function Ghost( n ) {
	EventEmitter.call( this );

	this.n = n;
}

util.inherits( Ghost, EventEmitter );

Ghost.prototype.startGame = function() {
	this.players = [];

	for( var i = 0; i < n; ++i ) {
		this.players.push( i );
	}
	
	this.emit( 'start' );
	
	if( this.players.length > 1 ) {
		this.startRound();
	}
	else {
		this.endGame();
	}
}

Ghost.prototype.endGame = function() {
	delete this.players;

	this.emit( 'end' );
}

Ghost.prototype.startRound = function() {
	this.word = [];

	this.state = 0;
	this.state_data = {
		last: null,
		turn: 0
	};
	
	this.emit( 'start_round' );
	
	this.startTurn();
}

Ghost.prototype.endRound = function() {
	delete this.word;
	
	delete this.state;
	delete this.state_data;
	
	this.emit( 'end_round' );
}

Ghost.prototype.nextRound = function() {
	this.endRound();
	
	if( this.players.length > 1 ) {
		this.startRound();
	}
	else {
		this.endGame();
	}
}

Ghost.prototype.startTurn = function() {
	this.emit( 'start_turn', this.state_data.turn );
}

Ghost.prototype.endTurn = function() {
	this.emit( 'end_turn', this.state_data.turn );
}

Ghost.prototype.nextTurn = function() {
	if( this.state === 0 ) {
		this.endTurn();
	
		this.state_data.last = this.state_data.turn;
		this.state_data.turn = ( this.state_data.turn + 1 ) % this.players.length;

		this.startTurn();
	}
	else {
		this.emit( 'critical', 'next turn called with state ' + this.state );
	}
}

// error messages are critical if the game logic puts the game in an inconsistent state, or there is some other corruption
// error messages are fail or warn if the game is sent an invalid message

Ghost.prototype.add = function( sender, letter ) {
	if( this.state === 0 ) {
		if( this.state_data.turn === sender ) {
			this.word.push( letter );

			this.emit( 'add', sender, letter );
			
			this.nextTurn();
		}
		else {
			this.emit( 'fail', sender, 'not your turn' );
		}
	}
	else if( this.state === 1 ) {
		this.emit( 'fail', sender, 'letters can\'t be added now' );
	}
	else if( this.state === 2 ) {
		if( this.state_data.challenged === sender ) {
			this.word.push( letter );

			this.emit( 'add', sender, letter );
		}
		else {
			this.emit( 'fail', sender, 'only the challenged player can add letters' );
		}
	}
	else {
		this.emit( 'critical', 'unknown state' );
	}
}

Ghost.prototype.remove = function( sender ) {
	if( this.state === 2 ) {
		if( this.state_data.challenged === sender ) {			
			if( this.word.length > this.prefix_length ) {
				this.word.pop();

				this.emit( 'remove', sender );
			}
			else {
				this.emit( 'fail', sender, 'can\'t remove more letters' );
			}
		}
		else {
			this.emit( 'fail', sender, 'only the challenged player can remove letters' );
		}
	}
	else if( this.state < 3 ) {
		this.emit( 'fail', sender, 'not the right state' );
	}
	else {
		this.emit( 'critical', 'unknown state' );
	}
}

Ghost.prototype.declare = function( sender ) {
	if( this.state === 0 ) {
		if( this.state_data.turn === sender ) {			
			if( this.word.length >= 3 ) {
				this.state = 1;

				this.state_data = {
					defense: this.state_data.last, 
					prosecution: this.state_data.turn
				};

				this.emit( 'declare', sender );
			}
			else {
				this.emit( 'fail', sender, 'word not long enough' );
			}
		}
		else {
			this.emit( 'fail', sender, 'not your turn' );
		}
	}
	else if( this.state === 2 ) {
		if( this.word.length > this.state_data.prefix_length ) {
			this.state = 1;

			this.state_data = {
				defense: this.state_data.challenger,
				prosecution: this.state_data.challenged
			};

			this.emit( 'declare', sender );
		}
		else {
			this.emit( 'fail', sender, 'must add at least one letter' );
		}
	}
	else if( this.state < 3 ) {
		this.emit( 'fail', sender, 'wrong state' );
	}
	else {
		this.emit( 'critical', 'unknown state: ' + this.state );
	}
}

Ghost.prototype.challenge = function( sender ) {
	if( this.state === 0 ) {
		if( this.state_data.turn === sender ) {
			if( this.word.length >= 2 ) {
				this.state = 2;

				this.state_data = {
					challenged: this.state_data.last,
					challenger: this.state_data.turn,
					prefix_length: this.word.length
				};;

				this.emit( 'challenge', this.state_data.challenger, this.state_data.challenged );
			}
			else {
				this.emit( 'fail', sender, 'word too short to challenge' );
			}
		}
		else {
			this.emit( 'fail', sender, 'not your turn' );
		}
	}
	else if( this.state < 3 ) {
		this.emit( 'fail', sender, 'wrong state' );
	}
	else {
		this.emit( 'critical', 'unknown state: ' + this.state );
	}
}

Ghost.prototype.rule = function( ruling ) {
	if( this.state === 1 ) {
		if( ruling === 1 ) {
			// get rid of defendant
		}
		else if( ruling === 2 ) {
			// get rid of prosecution
		}
		else {
			this.emit( 'warn', 'invalid ruling: ' + ruling );
		}
		
		if( ruling === 1 || ruling === 2 ) {
			this.nextRound();
		}
	}
	else {
		this.emit( 'warn', 'ruling called with state: ' + this.state );
	}
}


Ghost.prototype.getState = function() {
	return { state: this.state, state_data: this.state_data, word: this.word };
}

function TerminalInterface( n ) {
	this.game = new Ghost( n );

	this.game.on( 'turn', function( player ) {
		console.log( 'player ' + player + '\'s turn' );
	});

	this.game.on( 'add', function( player, letter ) {
		console.log( 'player ' + player + ' added ' + letter );
	});

	this.game.on( 'remove', function( player ) {
		console.log( 'player ' + player + ' removed a letter' );
	});

	this.game.on( 'vote', function( player ) {
		console.log( 'player ' + player + ' voted' );
	});

	this.game.on( 'challenge', function( challenger, challengee ) {
		console.log( 'player ' + challenger + ' challenged player ' + challengee );
	});

	this.game.on( 'declare', function( declarer ) {
		console.log( 'player ' + declarer + ' declared word' );
	});

	this.game.on( 'fail', function( causer, message ) {
		console.log( 'player ' + causer + ': ' + message );
	});
}

TerminalInterface.prototype.send = function( message ) {
	if( typeof( this.game[ message ] ) === 'function' ) {
		var args = [];

		for( var i = 1; i < arguments.length; ++i ) {
			args.push( arguments[i] );
		}

		this.game[ message ].apply( this.game, args );
	}
	else {
		console.log( 'INTERFACE: not a method' );
	}
}

exports.Game = TerminalInterface;

function NetworkInterface( id, creator, order ) {
	this.id = id;
	this.creator = creator;
	this.order = order;
	
	// if options && options.randomizeOrder then players = players.shuffle

	this.connections = new Map();
	this.players = new Map();

	this.state = 3; // waiting on everyone, not using state enums below just yet
	this.state_data = {
		connections: []
	};


	/*var self = this;
	
	this.onMessage = function( argument ) {
		self.doSomething();
	};*/
}
	

NetworkInterface.prototype.gather = function() { // so it times out
	var self = this;

	setTimeout( function() {
		// if there are no players, emit an empty game that should be removed
		// if there are players, give them the option to drop others
	}, 30000 );
}

NetworkInterface.STATE_WAITING_ON_EVERYONE = 0;

NetworkInterface.prototype.broadcast = function( message ) {
	this.connections.eachKey( function( ws ) {
		ws.send( message );
	});
}

NetworkInterface.prototype.isPlayer = function( player_name ) {
	return true;
}

NetworkInterface.prototype.join = function( ws, player_name ) {
	ws.on( 'message', function() {
		self.handle( ws, message );
	});

	ws.on( 'close', function() {
		// change this player to disconnected or something
	});

	if( this.state === 3 ) { // waiting to start the game
		this.broadcast( JSON.stringify({ type: 'join', player: player_name });

		this.connections.set( ws, player_name );
		this.players.set( player_name, ws );

		this.state_data.connections.push( player_name );

		ws.send( JSON.stringify({ type: 'init', players: this.order, joined: this.state_data.connections }) );

		if( this.state_data.connections.length === this.order.length ) {
			this.game = new Ghost( this.order.length );

			var self = this;

			// atomic transitions
			// transitions are not atomic if there transitions between which 
			// the user should do nothing

			this.game.on( 'start', function() {
				self.broadcast( JSON.stringify({ type: 'start' }) );
			});

			this.game.on( 'end', function() {
				self.broadcast( JSON.stringify({ type: 'end' }) );
				// client should interpret this as a redirect or something
				// this may be delayed until client acknowledgement
			});

			this.game.on( 'start_round', function() {
				self.broadcast( JSON.stringify({ type: 'start_round' }) );
			});

			this.game.on( 'end_round', function() {
				self.broadcast( JSON.stringify({ type: 'end_round' }) );
			});

			this.game.on( 'start_turn', function( player_index ) {
				self.broadcast( JSON.stringify({ type: '

			console.log( 'starting the game' );
			// create and start the game
			this.broadcast( JSON.stringify({ type: 'status', message: 'starting the game' }) );
		}
	}
	else { // suppose it is known the player can join? this occurs when someone drops out and joins
		this.game.getState();
	}
}

NetworkInterface.prototype.part = function( ws ) {
	this.connections.delete( ws );
}

/*this.game.on( 'turn', function( index ) {
	var player_name = this.order[ index ];

	if( this.players( player_name ) ) {
		// handle player
	}
	else {
		// broadcast that the player is not connected and will be given 30 seconds before a vote
	}
}*/

//ws, player_name

//var self = this;

//ws.on( 'close', function() {
	// how do we determine whether we are waiting for this player's input? it depends on the game
	// at the same time, this interface is specific to the game

NetworkInterface.prototype.vote = function( sender, vote ) {
	if( this.state === 1 ) {
		if( sender === this.state_data.prosecution ) {
			if( this.vote === 1 || this.vote === 2 ) {
				var previous_vote = this.state_data.votes[ sender ];
			
				this.state_data.votes[ sender ] = vote;
			
				if( ! previous_vote ) {
					this.state_data.votes_left = this.state_data.votes_left - 1;

					if( this.state_data.votes_left === 0 ) {
						this.state = 3;
						this.state_data = {
							acknowledgements: {},
							acknowledgements_left: this.players.length - 1
						};
						
						var out = null;
					
						var votes_is_word = this.state_data.votes.fold( 0, function( total, player, vote ) {
							if( vote === 1 ) {
								return total + 1;
							}
							else {
								return total;
							}
						});

						var votes_is_not_word = this.state_data.votes.fold( 0, function( total, player, vote ) {
							if( vote === 2 ) {
								return total + 1;
							}
							else {
								return total;
							}
						});

						if( this.state_data.advantage === this.state_data.prosecution ) {
							if( votes_is_not_word > votes_is_word ) {
								out = this.state_data.prosecution;
							}
							else {
								out = this.state_data.defense;
							}
						}
						else if( this.state_data.advantage === this.state_data.defense ) {
							if( votes_is_word > votes_is_not_word ) {
								out = this.state_data.defense;
							}
							else {
								out = this.state_data.prosecution;
							}
						}
						else {
							this.emit( 'critical', 'vote: unknown advantage: ' + this.state_data.advantage );
						}
						
						if( this.state_data.advantage === this.state_data.prosecution || this.state_data.advantage === this.state_data.defense ) {
							for( var i = 0; i < this.players.length; ++i ) {
								if( this.players[i] === out ) {
									this.players.splice( i, 1 );
								}
							}
									
							this.emit( 'out', out );
						}
					}
					else {
						this.emit( 'vote', sender );
					}
				}
				else {
					this.state_data.votes[ sender ] = vote;
				}
			}
			else {
				this.emit( 'fail', sender, 'invalid vote' );
			}
		}
		else {
			this.emit( 'fail', sender, 'you can\'t vote' );
		}
	}
	else if( this.state < 4 ) {
		this.emit( 'fail', sender, 'can\'t vote in this state' );
	}
	else {
		this.emit( 'critical', 'invalid state: ' + this.state );
	}
}

function Game() {}



Game.prototype.canContinueWithoutPlayer = function( player ) {

}

Game.prototype.removePlayer = function( player ) {
	if( this.canContinueWithoutPlayer( player ) ) {
		// remove the player, make changes, etc.
	}
	else {
		// kick everyone off
	}
}

Game.prototype.nextTurn = function() {
	// notify players that it is the next person's turn
	// set a timeout to drop the player
}

// the game may be able to be suspended (the game will not be removed from the 
// system if all the players leave.)
// when a player reconnects to the game, they receive the game state


exports.Game = Game;


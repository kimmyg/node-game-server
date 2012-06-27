var util = require('util');

var EventEmitter = require('events').EventEmitter;
var Map = require( '../../lib/map.js' ).Map;

require( '../../lib/object.js' );

// should not be able to join from another device!
// fix expiration of token for websockets
// make web-app-capable
// make scale unavailable, width=device-width
// add "so and so is typing..."
// change interface to look better
// make enter in the textfield send the message
// add leave in gathering
// clean up game end for ghost
// add shake to go back to game page
// add feedback for votes?
// add timeouts for players with voting to kick players
// on socket disconnect, attempt reconnect
// on socket error, do something (maybe same as above)
// make games reconnectable
// change urls to be more flexible (like auto redirect on trailing slash, etc.)
// forfeit option in ghost when challenged
// add removePlayer from game (logic is special when it's that players turn)
// fixed isPlayer in network interface

function Gathering( id, creator ) {
	EventEmitter.call( this );
	
	this.id = id;
	this.creator = creator;
	
	this.name_to_index = {};
	this.index_to_name = [];
	
	this.connections = new Map();
	this.players = new Map();
	
	var self = this;
	
	this.socket_onMessage = function( message ) {
		self.handle( this, message );
	};
	
	this.socket_onClose = function() {
		self.part( this );
	};
}

util.inherits( Gathering, EventEmitter );

Gathering.prototype.join = function( ws, player_name ) {
	ws.on( 'message', this.socket_onMessage );
	ws.on( 'close', this.socket_onClose );

	if( this.index_to_name.length === 0 ) {
		ws.send( JSON.stringify({ type: 'creator' }) );
	}

	this.name_to_index[ player_name ] = this.index_to_name.length;
	this.index_to_name.push( player_name );

	ws.send( JSON.stringify({ type: 'players', players: this.index_to_name }) );
	this.broadcast( JSON.stringify({ type: 'add_player', player_name: player_name }) );
	
	this.connections.set( ws, player_name );
	this.players.set( player_name, ws );
}

Gathering.prototype.part = function( ws ) {
	var player_name = this.connections.delete( ws ), player_index = this.name_to_index[ player_name ];
	
	this.players.delete( player_name );
	
	delete this.name_to_index[ player_name ];
	this.index_to_name.splice( player_index, 1 );
	
	this.broadcast( JSON.stringify({ type: 'remove_player', player_name: player_name }) );
		
	if( this.index_to_name.length === 0 ) {
		this.emit( 'empty' );
	}
	else if( player_index === 0 ) {
		this.creator = this.index_to_name[0];
			
		this.emit( 'new_creator', this.creator );
		this.players.get( this.creator ).send( JSON.stringify({ type: 'creator' }) );
	}
}

Gathering.prototype.broadcast = function( message ) {
	this.connections.each( function( ws, player_name ) {
		ws.send( message );
	});
}

Gathering.prototype.handle = function( ws, message ) {
	var sender = this.connections.get( ws ), message = JSON.parse( message );

	if( message.type === 'start' ) {
		if( sender === this.creator ) {
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
	return new NetworkInterface( this.id, this.creator, this.index_to_name.concat() );
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

Ghost.prototype.start = function() {
	this.players = [];

	for( var i = 0; i < this.n; ++i ) {
		this.players.push( i );
	}
	
	this.emit( 'start' );
	
	if( this.players.length > 1 ) {
		this.startRound();
	}
	else {
		this.end();
	}
}

Ghost.prototype.end = function() {
	this.emit( 'end', this.players[0] );
	
	delete this.players;
}

Ghost.prototype.startRound = function() {
	this.word = [];

	this.state = 0;
	this.substate = {
		i: 0,
		last: null,
		turn: this.players[0]
	};
	
	this.emit( 'round-start' );
	
	this.startTurn();
}

Ghost.prototype.endRound = function() {
	delete this.word;
	
	delete this.state;
	delete this.substate;
	
	this.emit( 'round-end' );
}

Ghost.prototype.nextRound = function() {
	this.endRound();
	
	if( this.players.length > 1 ) {
		this.startRound();
	}
	else {
		this.end();
	}
}

Ghost.prototype.startTurn = function() {
	this.emit( 'turn-start', this.substate.turn );
}

Ghost.prototype.endTurn = function() {
	this.emit( 'turn-end', this.substate.turn );
}

Ghost.prototype.nextTurn = function() {
	if( this.state === 0 ) {
		this.endTurn();
	
		this.substate.i = ( this.substate.i + 1 ) % this.players.length;
		this.substate.last = this.substate.turn;
		this.substate.turn = this.players[ this.substate.i ];

		this.startTurn();
	}
	else {
		this.emit( 'critical', 'next turn called with state ' + this.state );
	}
}

// error messages are critical if the game logic puts the game in an inconsistent state, or there is some other corruption
// error messages are fail or warn if the game is sent an invalid message

Ghost.prototype.msg_add = function( sender, letter ) {
	if( this.state === 0 ) {
		if( this.substate.turn === sender ) {
			this.word.push( letter );

			this.emit( 'letter-added', sender, letter );
			
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
		if( this.substate.challenged === sender ) {
			this.word.push( letter );

			this.emit( 'letter-added', sender, letter );
		}
		else {
			this.emit( 'fail', sender, 'only the challenged player can add letters' );
		}
	}
	else {
		this.emit( 'critical', 'unknown state' );
	}
}

Ghost.prototype.msg_remove = function( sender ) {
	if( this.state === 2 ) {
		if( this.substate.challenged === sender ) {			
			if( this.word.length > this.substate.prefix_length ) {
				this.word.pop();

				this.emit( 'letter-removed', sender );
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

Ghost.prototype.msg_declare = function( sender ) {
	if( this.state === 0 ) {
		if( this.substate.turn === sender ) {			
			if( this.word.length >= 3 ) {
				this.state = 1;

				this.substate = {
					defense: this.substate.last, 
					prosecution: this.substate.turn
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
		if( this.word.length > this.substate.prefix_length ) {
			this.state = 1;

			this.substate = {
				defense: this.substate.challenger,
				prosecution: this.substate.challenged
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

Ghost.prototype.msg_challenge = function( sender ) {
	if( this.state === 0 ) {
		if( this.substate.turn === sender ) {
			if( this.word.length >= 2 ) {
				this.state = 2;

				this.substate = {
					challenged: this.substate.last,
					challenger: this.substate.turn,
					prefix_length: this.word.length
				};;

				this.emit( 'challenge', this.substate.challenger, this.substate.challenged );
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
		if( ruling === 1 || ruling === 2 || ruling === 3 ) {
			if( ruling === 1 ) {
				for( var i = 0; i < this.players.length; ++i ) {
					if( this.players[i] === this.substate.defense ) {
						this.players.splice( i, 1 );
					}
				}
				
				this.emit( 'out', this.substate.defense );
			}
			else if( ruling === 2 ) {
				for( var i = 0; i < this.players.length; ++i ) {
					if( this.players[i] === this.substate.prosecution ) {
						this.players.splice( i, 1 );
					}
				}
				
				this.emit( 'out', this.substate.prosecution );
			}
			else {
				this.emit( 'tie' );
			}
			
			this.nextRound();
		}
		else {
			this.emit( 'warn', 'invalid ruling: ' + ruling );
		}
	}
	else {
		this.emit( 'warn', 'ruling called with state: ' + this.state );
	}
}


Ghost.prototype.getState = function() {
	return { state: this.state, substate: this.substate, word: this.word };
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


// if options && options.randomizeOrder then players = players.shuffle

function NetworkInterface( id, creator, index_to_name ) {
	EventEmitter.call( this );

	this.id = id;
	this.creator = creator;
	
	this.index_to_name = index_to_name;
	this.name_to_index = {};
	
	for( var i = 0; i < this.index_to_name.length; ++i ) {
		this.name_to_index[ this.index_to_name[i] ] = i;
	}

	this.connections = new Map();
	this.players = new Map();

	this.state = 3; // waiting on everyone, not using state enums below just yet
	this.substate = {
		connections: []
	};

	var self = this;
	
	this.onMessage = function( message ) {
		self.handle( this, message );
	};
	
	this.onClose = function() {
		self.part( this );
	};
	
	this.onCritical = function( message ) {
		console.log( message );
	};
	
	this.onFail = function( player_index, message ) {
		self.players.get( self.index_to_name[ player_index ] ).send( JSON.stringify({ type: 'fail', message: message }) );
	};
}

util.inherits( NetworkInterface, EventEmitter );

NetworkInterface.prototype.gather = function() { // so it times out
	var self = this;

	setTimeout( function() {
		// if there are no players, emit an empty game that should be removed
		// if there are players, give them the option to drop others
	}, 30000 );
}

NetworkInterface.STATE_TURN = 0;
NetworkInterface.STATE_DECLARE = 1; // voting done here
NetworkInterface.STATE_CHALLENGE = 2;
NetworkInterface.STATE_GATHERING = 3;

NetworkInterface.prototype.broadcast = function( message ) {
	this.connections.each( function( ws ) {
		ws.send( message );
	});
}

NetworkInterface.prototype.isPlayer = function( player_name ) {
	return this.name_to_index.hasOwnProperty( player_name );
}

NetworkInterface.prototype.endGame = function() {
	this.broadcast( JSON.stringify({ type: 'end' }) );
}


NetworkInterface.prototype.join = function( ws, player_name ) {
	ws.on( 'message', this.onMessage );
	ws.on( 'close', this.onClose );

	if( this.state === 3 ) { // waiting to start the game
		var player_index = this.name_to_index[ player_name ];
	
		this.broadcast( JSON.stringify({ type: 'join', player_index: player_index }) );

		this.connections.set( ws, player_name );
		this.players.set( player_name, ws );

		this.substate.connections.push( player_index );

		ws.send( JSON.stringify({ type: 'init', players: this.index_to_name, present: this.substate.connections }) );

		if( this.substate.connections.length === this.index_to_name.length ) {
			this.n = this.index_to_name.length;
		
			this.game = new Ghost( this.n );

			var self = this;

			// atomic transitions
			// transitions are not atomic if there transitions between which 
			// the user should do nothing

			this.game.on( 'critical', this.onCritical );
			this.game.on( 'fail', this.onFail );

			this.game.on( 'start', function() {
				self.state = 0;
			
				self.broadcast( JSON.stringify({ type: 'start' }) );
			});
			
			['round-start', 'round-end'].forEach( function( event ) {
				self.game.on( event, function() {
					self.broadcast( JSON.stringify({ type: event }) );
				});
			});

			this.game.on( 'end', function() {
				self.emit( 'end' );
				// client should interpret this as a redirect or something
				// this may be delayed until client acknowledgement
			});

			this.game.on( 'letter-added', function( player_index, letter ) {
				self.broadcast( JSON.stringify({ type: 'letter-added', letter: letter }) );
			});
			
			this.game.on( 'letter-removed', function( player_index ) {
				self.broadcast( JSON.stringify({ type: 'letter-removed' }) );
			});

			this.game.on( 'turn-start', function( player_index ) {
				var message = {
					type: 'turn',
					turn: player_index
				};
				
				var broadcast_message = JSON.stringify( message );
				
				message.own = true;
				
				var target_message = JSON.stringify( message );
				
				self.connections.each( function( ws, player_name ) {
					if( self.name_to_index[ player_name ] === player_index ) {
						ws.send( target_message );
					}
					else {
						ws.send( broadcast_message );
					}
				});
			});
			
			this.game.on( 'challenge', function( challenger_index, challenged_index ) {
				var message = {
					type: 'challenge',
					challenger: challenger_index,
					challenged: challenged_index
				};
				
				var broadcast_message = JSON.stringify( message );
				
				message.is_challenged = true;
				
				var target_message = JSON.stringify( message );
				
				self.connections.each( function( ws, player_name ) {
					if( self.name_to_index[ player_name ] === challenged_index ) {
						ws.send( target_message );
					}
					else {
						ws.send( broadcast_message );
					}
				});
			});
			
			this.game.on( 'declare', function( declarer_index ) {
				self.state = 1;
				self.substate = {
					votes: {},
					votes_left: this.n - 1
				};
				
				self.substate.votes[ self.index_to_name[ declarer_index ] ] = 1; 
				
				var message = {
					type: 'declare',
					declarer: declarer_index
				};
				
				var broadcast_message = JSON.stringify( message );
				
				message.is_declarer = true;
				
				var target_message = JSON.stringify( message );
				
				self.connections.each( function( ws, player_name ) {
					if( self.name_to_index[ player_name ] === declarer_index ) {
						ws.send( target_message );
					}
					else {
						ws.send( broadcast_message );
					}
				});
			});
			
			this.game.on( 'out', function( player_index ) {
				self.broadcast( JSON.stringify({ type: 'out', out: player_index }) );
			});
			
			this.game.on( 'tie', function() {
				self.broadcast( JSON.stringify({ type: 'tie' }) );
			});

			this.game.start();
		}
	}
	else { // suppose it is known the player can join? this occurs when someone drops out and joins
		ws.send( JSON.stringify({ type: 'init', players: this.index_to_name, present: this.substate.connections, state: this.game.getState() }) );
	}
}

NetworkInterface.prototype.part = function( ws ) {
	var player_name = this.connections.delete( ws );

	this.players.delete( player_name );

	this.broadcast( JSON.stringify({ type: 'left', player_index: this.name_to_index[ player_name ] }) );
}

NetworkInterface.prototype.handle = function( ws, message ) {
	var player_name = this.connections.get( ws ), player_index = this.name_to_index[ player_name ];
	
	var args = message.split( '|' );
	
	message = args[0];
	
	args[0] = player_index;
	
	if( this.game[ 'msg_' + message ] ) {
		this.game[ 'msg_' + message ].apply( this.game, args );
	}
	else if( message === 'vote' ) {
		if( this.state === 1 ) {
			if( player_index === this.substate.declarer ) {
				this.onFail( player_index, 'you can\'t vote!' );
			}
			else {
				var vote = parseInt( args[1] );
				
				if( vote === 1 || vote === 2 ) {
					if( this.substate.votes[ player_name ] ) {
						this.substate.votes[ player_name ] = vote;
					}
					else {
						this.substate.votes[ player_name ] = vote;
						this.substate.votes_left = this.substate.votes_left - 1;
					}
				}
				else {
					this.onFail( this.name_to_index[ player_name ], 'not a valid vote' );
				}
			}
		}
		else {
			this.onFail( this.name_to_index[ player_name ], 'cannot vote in this state' );
		}
	}
	else {
		// send unrecognized message
	}
	// map from ws to player index
	// send message to game instance
}

/*
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
					}
					
					if( this.substate.votes_left === 0 ) {
						var affirm_word_votes = this.substate.votes.fold( 0, function( total, player, vote ) {
							if( vote === 1 ) {
								return total + 1;
							}
							else {
								return total;
							}
						});

						var negate_word_votes = this.substate.votes.fold( 0, function( total, player, vote ) {
							if( vote === 2 ) {
								return total + 1;
							}
							else {
								return total;
							}
						});
						
						if( affirm_word_votes > negate_word_votes ) {
							this.game.rule( 1 );
						}
						else if( affirm_word_votes < negate_word_votes ) {
							this.game.rule( 2 );
						}
						else {
							this.game.rule( 3 );
						}
					}
				}
				else {
					this.onFail( player_index, 'not a valid vote' );
				}
			}
		}
		else {
			this.onFail( player_index, 'cannot vote in this state' );
		}
	}
	else {
		this.onFail( player_index, 'unrecognized message: ' + message );
	}
}
*/

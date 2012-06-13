var util = require('util');

var EventEmitter = require('events').EventEmitter;

function Ghost( n ) {
	EventEmitter.call( this );

	this.n = n;
}

util.inherits( Ghost, EventEmitter );

Ghost.prototype.start = function() {
	this.word = [];

	this.state = 0;
	this.state_data = { last: null, turn: 0 };

	this.emit( 'turn', this.state_data.turn );
}

Ghost.prototype.nextTurn = function() {
	if( this.state === 0 ) {
		this.state_data.last = this.state_data.turn;
		this.state_data.turn = ( this.state_data.turn + 1 ) % this.n;

		this.emit( 'turn', this.state_data.turn );
	}
	else {
		this.emit( 'critical', 'next turn called with state ' + this.state );
	}
}

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
	else if( this.state === 3 ) {
		this.emit( 'fail', sender, 'can\'t add letter; round is over' );
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
	else if( this.state < 4 ) {
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
					prosecution: this.state_data.turn,
					votes: {},
					votes_left: this.n
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
				prosecution: this.state_data.challenged,
				votes: {},
				votes_left: this.n - 2
			};

			this.emit( 'declare', sender );
		}
		else {
			this.emit( 'fail', sender, 'must add at least one letter' );
		}
	}
	else if( this.state < 4 ) {
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
	else if( this.state < 4 ) {
		this.emit( 'fail', sender, 'wrong state' );
	}
	else {
		this.emit( 'critical', 'unknown state: ' + this.state );
	}
}

Ghost.prototype.vote = function( sender, vote ) {
	if( this.state === 1 ) {
		if( ! ( sender === this.state_data.prosecution || sender === this.state_data.defense ) ) {
			if( this.vote === 1 || this.vote === 2 ) {
				if( ! this.state_data.votes[ sender ] ) {
					this.state_data.votes[ sender ] = vote;
					this.state_data.votes_left = this.state_data.votes_left - 1;

					if( this.state_data.votes_left === 0 ) {
						// count votes and set things
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

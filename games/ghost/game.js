var util = require('util');
var EventEmitter = require('events').EventEmitter;

function Gathering() {
	EventEmitter.call( this );
	
	this.players = {};
	this.count = 0;
}

util.inherits( Gathering, EventEmitter );

Gathering.prototype.addPlayer = function( ws, player_name ) {
	if( ! this.players.hasOwnProperty( player_name ) ) {
		// add player
		// introduce players to each other
		
		this.count = this.count + 1;
	}
}

Gathering.prototype.removePlayer = function( ws ) {
	var player_name = this.playerNameForConnection( ws );
	
	if( player_name ) {
		// remove player
		// notify other players of all requisite info
		
		this.count = this.count - 1;
		
		if( this.count === 0 ) {
			this.emit( 'empty' );
		}
	}
}

Gathering.prototype.playerNameForConnection = function( ws ) {
	for( var player_name in this.players ) {
		if( this.players.hasOwnProperty( player_name ) ) {
			if( this.players[ player_name ] === ws ) {
				return player_name;
			}
		}
	}
}

exports.Gathering = Gathering;

function Game() {}

exports.Game = Game;
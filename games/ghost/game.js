var util = require('util');
var EventEmitter = require('events').EventEmitter;

function Gathering( id, creator ) {
	EventEmitter.call( this );
	
	this.id = id;
	this.creator = creator;
	
	this.order = [];
	this.indices = {};
	this.connections = {}
}

util.inherits( Gathering, EventEmitter );

// THIS IS NOT A ROOM WITH OTHER PLAYERS!!!!!
// IT IS A GAME CONFIGURATION
// SEND INFORMATION APPROPRIATELY

Gathering.prototype.addPlayer = function( ws, player_name ) {
	if( ! this.connections.hasOwnProperty( player_name ) ) {
		this.broadcast( JSON.stringify({ type: 'add', name: player_name }) );
		
		for( var i = 0; i < this.order.length; ++i ) {
			ws.send( JSON.stringify({ type: 'add', this.order[i] 
		
		this.indices[ player_name ] = this.order.length;
		this.order.push( player_name );
		this.connections[ player_name ] = ws;
	}
}

Gathering.prototype.removePlayer = function( ws ) {
	var player_name = this.playerNameForConnection( ws );
	
	if( player_name ) {
		this.order.splice( this.indices[ player_name ], 1 );
		delete this.indices[ player_name ];
		delete this.connections[ player_name ];
		
		this.broadcast( JSON.stringify({ type: 'remove', name: player_name }) );
		
		if( this.order.length === 0 ) {
			this.emit( 'empty' );
		}
	}
}

Gathering.prototype.playerNameForConnection = function( ws ) {
	for( var player_name in this.connections ) {
		if( this.connections.hasOwnProperty( player_name ) ) {
			if( this.connections[ player_name ] === ws ) {
				return player_name;
			}
		}
	}
}

Gathering.prototype.broadcast = function( message ) {
	for( var player_name in this.players ) {
		if( this.players.hasOwnProperty( player_name ) ) {
			this.players[ player_name ].send( message );
		}
	}
}

exports.Gathering = Gathering;

function Game() {}

exports.Game = Game;
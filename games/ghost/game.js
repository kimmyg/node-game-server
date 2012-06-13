var util = require('util');

var EventEmitter = require('events').EventEmitter;
var Map = require( '../../lib/map.js' ).Map;

function Gathering( id, creator ) {
	EventEmitter.call( this );
	
	this.id = id;
	this.creator = creator;
	
	this.order = [];
	this.connections = new Map();
	this.players = new Map();
}

util.inherits( Gathering, EventEmitter );

// THIS IS NOT A ROOM WITH OTHER PLAYERS!!!!!
// IT IS A GAME CONFIGURATION
// SEND INFORMATION APPROPRIATELY

Gathering.prototype.addPlayer = function( ws, player_name ) {
	if( this.order.length === 0 ) {
		ws.send( JSON.stringify({ type: 'creator' }) );
	}

	ws.send( JSON.stringify({ type: 'players', players: this.order }) );
		
	this.order.push( player_name );
	this.connections.set( ws, player_name );
	this.players.set( player_name, ws );
		
	this.broadcast( JSON.stringify({ type: 'add', name: player_name }) );
}

Gathering.prototype.removePlayer = function( ws ) {
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

exports.Gathering = Gathering;

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
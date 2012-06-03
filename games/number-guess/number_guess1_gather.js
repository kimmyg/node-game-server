var util = require( 'util' );

var EventEmitter = require( 'events' ).EventEmitter;

function Gather() {
	EventEmitter.call( this );

	this.guesser = null;
	this.guessee = null;
}



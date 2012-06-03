var util = require( 'util' );

function Pool() {
	EventEmitter.call( this );

	this.players = {};
}

util.inherits( Pool, EventEmitter );

Pool.prototype.



want

server:8000/ - prompted to log in, given a list of games - no websocket - games come from directory
server:port/<game> - prompted to log in, given a list of instances part of + gatherings + new game - no websocket
server:port/<game>/new - prompted to log in, taken to a gather screen with an instance id
server:port/<game>/<instance_id> - join game back where they were


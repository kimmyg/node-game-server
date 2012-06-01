function ConsoleInterface() {}

ConsoleInterface.prototype.notify = function( target, message ) {
	console.log( 'note ' + target + ': ' + message );
}

ConsoleInterface.prototype.warn = function( target, message ) {
	console.log( 'warn ' + target + ': ' + message );
}

ConsoleInterface.prototype.broadcast = function( message ) {
	console.log( 'to all: ' + message );
}

ConsoleInterface.prototype.send = function( sender, message, argument ) {
	this.target['yy_' + message]( sender, argument );
}

exports.interface = ConsoleInterface;

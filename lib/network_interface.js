function NetworkInterface() {
	var self = this;

	this.data_listener = function( data ) {
		var arguments = data.split( '|' );

		var name = '__' + arguments[0];
		
		arguments[0] = this.indexForSocket( this );

		if( self.target[ name ] ) {
			self.target[ name ]( index, arguments.slice

		

		self.do_something( this, data );
	}

	this.close_listener = function( error ) {
		var index = self.indexForSocket( this );

		// notify the game to remove the player. figure out game suspension, state encapsulation, etc.

		self.sockets.splice( index, 0 );
	}
}

NetworkInterface.prototype.socketForIndex = function( index ) {
	return this.sockets[ index ];
}

NetworkInterface.prototype.indexForSocket = function( socket ) {
	for( var index = 0; index < this.sockets.length; index = index + 1 ) {
		if( this.sockets[ index ] === socket ) {
			return index;
		}
	}
}

NetworkInterface.prototype.add = function( socket ) {
	socket.on( 'data', this.data_listener );
}

var count = 0;

var server = new net.Server();

server.on( 'connection', function( socket ) {
	count = count + 1;

	if( count === 2 ) {
		this.close();
	}
});

server.on( 'close', function() {
	console.log( 'server closed' );
}

server.listen( 8000, function() {
	console.log( this + ' listening on 8000' );
});

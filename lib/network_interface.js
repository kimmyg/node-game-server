function NetworkInterface() {

}

NetworkInterface.prototype.add = function( socket ) {
	var self = this;

	socket.on( 'data', function( data ) {
		self.do_something( this, data );
	});
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

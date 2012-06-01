var crypto = require( 'crypto' );

var WebSocket = {
	MAGIC_STRING: '258EAFA5-E914-47DA-95CA-C5AB0DC85B11',

	create: function( socket, headers ) {
		socket.write( "HTTP/1.1 101 WebSocket Protocol Handshake\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + WebSocket.accept( headers['sec-websocket-key'] ) + "\r\n\r\n" );

		socket.on( 'data', function( data ) { // this is dependent on whether the encoding is set; figure out a way to stop that
			var mask = data.readUInt32BE( 2 );

			for( var i = 6; i < data.length; i = i + 4 ) {
				data.writeUInt32BE( data.readUInt32BE( i, true ) ^ mask, i, true );
			}

			this.emit( 'message', data.slice( 6 ).toString( 'utf8' ) );
		});

		socket.send = WebSocket.send;
	},

	accept: function( key ) {
		var hash = crypto.createHash( 'sha1' );

		hash.update( key + WebSocket.MAGIC_STRING );

		return hash.digest( 'base64' );
	},

	send: function( message ) {
		this.write( message );
	}
};

exports.WebSocket = WebSocket;

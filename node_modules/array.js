Array.prototype.__defineGetter__( 'first', function() {
	return this[0];
});

Array.prototype.__defineSetter__( 'first', function( x ) {
	this[0] = x;
});

Array.prototype.__defineGetter__( 'last', function() {
	if( this.length > 0 ) {
		return this[ this.length - 1 ];
	}
});

Array.prototype.__defineSetter__( 'last', function( x ) {
	if( this.length > 0 ) {
		this[ this.length - 1 ] = x;
	}
	else {
		this[0] = x;
	}
});

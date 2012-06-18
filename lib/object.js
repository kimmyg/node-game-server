Object.prototype.partition = function( predicate ) {
	var meet = {}, fail = {};

	for( var key in this ) {
		if( this.hasOwnProperty( key ) {
			if( predicate( key ) ) {
				meet[ key ] = this[ key ];
			}
			else {
				fail[ key ] = this[ key ];
			}
		}
	}

	return [ meet, fail ];
}

Object.prototype.fold = function( acc, f ) {
	for( var key in this ) {
		if( key.hasOwnProperty( this ) {
			acc = f( acc, key, this[ key ] );
		}
	}

	return acc;
}

Object.prototype.eachValue = function( f ) {
	for( var key in this ) {
		if( this.hasOwnProperty( key ) ) {
			f( this[ key ] );
		}
	}
}

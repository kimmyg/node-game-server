function Map() {
	this.entries = [];
}

Map.prototype.set = function( key, value ) {
	for( var i = 0; i < this.entries.length; ++i ) {
		if( this.entries[i].key === key ) {
			return false;
		}
	}
	
	this.entries.push({ key: key, value: value });
	
	return true;
}

Map.prototype.get = function( key ) {
	for( var i = 0; i < this.entries.length; ++i ) {
		if( this.entries[i].key === key ) {
			return this.entries[i].value;
		}
	}
}

Map.prototype.has = function( key ) {
	for( var i = 0; i < this.entries.length; ++i ) {
		if( this.entries[i].key === key ) {
			return true;
		}
	}
	
	return false;
}

Map.prototype.delete = function( key ) {
	for( var i = 0; i < this.entries.length; ++i ) {
		if( this.entries[i].key === key ) {
			var value = this.entries[i].value;
			
			this.entries.splice( i, 1 );
			
			return value;
		}
	}
}

Map.prototype.count = function() {
	return this.entries.length;
}

Map.prototype.eachKey = function( cb ) {
	for( var i = 0; i < this.entries.length; ++i ) {
		cb( this.entries[i].key );
	}
}

exports.Map = Map;
function PlayerList( id ) {
	this.id = id;
}

PlayerList.prototype.createElement = function() {
	var element = document.createElement( 'ul' );
	
	element.className = 'player-list';
	element.id = this.id;
	
	return element;
}

PlayerList.prototype.add = function( player_name ) {
	var element = document.createElement( 'li' );
	
	element.id = player_name;
	element.innerText = player_name;
	
	$( this.id ).appendChild( element );
}

PlayerList.prototype.remove = function( player_name ) {
	var element = $( player_name ), parent_element = $( this.id );
	
	if( element && parent_element && element.parentElement === parent_element ) {
		parent_element.removeChild( element );
	}
}

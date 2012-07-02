function List( id, title ) {
	this.id = id;
	this.title = title;
}

List.prototype.createElement = function() {
	var container_element = document.createElement( 'div' );
	
	container_element.className = 'header';
	
	var title_span = document.createElement( 'span' );
	title_span.className = 'title';
	title_span.innerText = this.title;
	container_element.appendChild( title_span );
	
	var list_ul = document.createElement( 'ul' );
	list_ul.id = this.id;
	container_element.appendChild( list_ul );
	
	return container_element;
};


List.prototype.add = function( id, element ) {
	var item = document.createElement( 'li' );
	
	item.id = this.id + '-' + id;
	item.appendChild( element );
	
	$( this.id ).appendChild( item );
}

List.prototype.remove = function( id ) {
	var element = $( this.id + '-' + id );
	
	if( element ) {
		element.parentElement.removeChild( element );
	}
}

List.prototype.transform = function( id, transform ) {
	var element = $( this.id + '-' + id );
	
	if( element ) {
		transform( element );
	}
}

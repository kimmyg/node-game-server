exports.redirect = function( response, location, message ) {
	if( message ) {
		response.writeHead( 200, { 'Content-Type': 'text/html' } );
		response.end( '<!DOCTYPE html><html><head><script type="text/javascript">window.onload = function( event ) {window.setTimeout( function() { window.location = "' + location + '"; }, 5000 ); }</script></head><body>' + message + '</body></html>' );
	}
	else {
		response.writeHead( 303, { 'Location': location } );
		response.end();
	}
}

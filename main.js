var fs = require( 'fs' );

exports.handle = function( response, user_info ) {
	fs.readdir( 'games', function( error, entries ) {
		if( error ) {
		
		}
		else {
			response.write( '<!DOCTYPE html><html><head><link rel="stylesheet" href="style.css"/></head><body>' );
		
			entries.forEach( function( entry ) {
				response.write( '<a href="/' + entry + '/">' + entry + '</a><br/>' );
			});
			
			response.write( '</body></html>' );
		}

		response.end();
	});
}

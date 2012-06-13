var fs = require( 'fs' );

exports.handle = function( user_info, response ) {
	fs.readdir( 'games', function( error, entries ) {
		if( error ) {
		
		}
		else {
			entries.forEach( function( entry ) {
				response.write( '<a href="/' + entry + '">' + entry + '</a><br/>' );
			});
		}

		response.end();
	});
}

var fs = require( 'fs' );

exports.handle = function( response, user_info ) {
	fs.readdir( 'games', function( error, entries ) {
		if( error ) {
		
		}
		else {
			entries.forEach( function( entry ) {
				response.write( '<a href="/' + entry + '/">' + entry + '</a><br/>' );
			});
		}

		response.end();
	});
}

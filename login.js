var crypto = require( 'crypto' );
var fs = require( 'fs' );
var qs = require( 'querystring' );
var url = require( 'url' );

var accounts = JSON.parse( fs.readFileSync( 'accounts', 'utf8' ) );


var main = require( './main.js' );

exports.handle = function( request, response ) {
	if( request.method === 'POST' ) {
		var body = '';

		request.on( 'data', function( data ) {
			body = body + data.toString( 'utf8' );
		});

		request.on( 'end', function() {
			var credentials = qs.parse( body );

			if( accounts[ credentials.name ] ) {
				var hash = crypto.createHash( 'sha1' );

				hash.update( credentials.password, 'utf8' );

				if( hash.digest( 'hex' ) === accounts[ credentials.name ] ) {
					hash = crypto.createHash( 'sha1' );

					hash.update( credentials.name, 'utf8' );
					hash.update( 'humblebundle', 'utf8' );

					response.writeHead( 303, {
						'Location': url.parse( request.url, true ).query.redirect,
						'Set-Cookie': hash.digest( 'base64' )
					});
					response.end();
				}
				else {
					// password is wrong, redo this thing
				}
			}
			else {
				response.writeHead( 200, { 'Content-Type': 'text/html' } );
				response.end( 'There is no account named "' + credentials.name + '".' );
			}
		});
	}
	else {
		response.writeHead( 200, { 'Content-Type': 'text/html' } );
		response.write( '<form action="/login?redirect=' + request.url + '" method="post">' );
		response.write( 'Name <input name="name" type="text" length="15"/><br/>' );
		response.write( 'Password <input name="password" type="password" length="15"/><br/>' );
		response.write( '<input type="submit" value="Log in"/><br/>' );
		response.write( '</form>' );
		response.end();
	}
/*
	if( request.headers.cookie ) {
		// lookup cookie; if good
		
		if( request.url === '/' ) {
			main.handle.call( this, request, response );
		}
		else {
			fs.stat( 'games' + request.url, function( error, stats ) {
				if( error ) {
					response.writeHead( 404 );
					response.end();
				}
				else {
					response.writeHead( 200 );
					response.end( request.url );
				}
			});
		}
	}
	else {
		response.setHeader( 'Set-Cookie', 'test_cookie' );
		response.end();
	}
*/
}

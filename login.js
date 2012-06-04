var crypto = require( 'crypto' );
var fs = require( 'fs' );
var qs = require( 'querystring' );
var url = require( 'url' );

var accounts = JSON.parse( fs.readFileSync( 'accounts', 'utf8' ) );

var main = require( './main.js' );

var tokenForName = function( name ) {
	var hash = crypto.createHash( 'sha1' );

	hash.update( name, 'utf8' );
	hash.update( 'humblebundle', 'utf8' );
	
	return hash.digest( 'hex' );
}

var hashPassword = function( password ) {
	var hash = crypto.createHash( 'sha1' );

	hash.update( password, 'utf8' );
	
	return hash.digest( 'hex' );
}

exports.tokenIsValid = function( name, token ) {
	return ( token === tokenForName( name ) );
}

exports.handle = function( request, response ) {
	if( request.method === 'POST' ) {
		var body = '';

		request.on( 'data', function( data ) {
			body = body + data.toString( 'utf8' );
		});

		request.on( 'end', function() {
			var credentials = qs.parse( body );

			if( accounts[ credentials.name ] ) {
				if( hashPassword( credentials.password ) === accounts[ credentials.name ] ) {
					console.log( 'correct password' );
					
					response.writeHead( 303, {
						'Location': url.parse( request.url, true ).query.redirect,
						'Set-Cookie': [ 'name=' + credentials.name, 'token=' + tokenForName( credentials.name ) ]
					});
					response.end();
				}
				else {
					// password is wrong, redo this thing
					console.log( 'incorrect password' );
				}
			}
			else {
				console.log( 'no account' );
			
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
}

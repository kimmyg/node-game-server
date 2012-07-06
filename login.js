var cookie = require('cookie');
var crypto = require('crypto');
var fs = require('fs');
var qs = require('querystring');
var redirect = require('redirect').redirect;
var url = require('url');

var accounts = JSON.parse( fs.readFileSync( 'db/accounts', 'utf8' ) );

var createToken = function( expiration, name ) {
	var hash = crypto.createHash( 'sha1' );

	hash.update( expiration, 'utf8' );
	hash.update( name, 'utf8' );
	hash.update( 'humblebundle', 'utf8' );
	
	return hash.digest( 'hex' );
}

var hashPassword = function( password ) {
	var hash = crypto.createHash( 'sha1' );

	hash.update( password, 'utf8' );
	
	return hash.digest( 'hex' );
}

var tokenIsValid = function( expiration, name, token ) { // they may be able to log in but not connect, solve that!
	return ( ( token === createToken( expiration, name ) ) && ( Date.now() < parseInt( expiration ) ) );
}

var onNoCredentials = function( request, response ) {
	if( request.method === 'POST' ) {
		var body = '';

		request.on( 'data', function( data ) {
			body = body + data.toString( 'utf8' );
		});

		request.on( 'end', function() {
			var credentials = qs.parse( body );

			if( accounts[ credentials.name ] ) {
				if( hashPassword( credentials.password ) === accounts[ credentials.name ] ) {
					var expiration = ( Date.now() + 1000 * 60 * 60 * 24 ).toString(), maxAge = ( 60 * 60 * 24 * 365 );
					
					response.writeHead( 303, {
						'Location': url.parse( request.url, true ).query.redirect,
						'Set-Cookie': [ 'expiration=' + expiration, 'name=' + credentials.name, 'token=' + createToken( expiration, credentials.name ), 'Max-Age=' + maxAge ]
					});
					response.end();
				}
				else {
					// password is wrong, redo this thing
					console.log( 'incorrect password' );
					
					response.writeHead( 200, { 'Content-Type': 'text/html' } );
					response.end( 'The password was incorrect for the account named "' + credentials.name + '".' );
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

exports.handle = function( request, response, onSuccess, onFail ) {
	if( request.headers.cookie ) {
		var info = cookie.parse( request.headers.cookie );

		if( info.expiration && info.name && info.token ) {
			info = { 'expiration': info.expiration, 'name': info.name, 'token': info.token };

			if( tokenIsValid( info.expiration, info.name, info.token ) ) {
				var pathname = url.parse( request.url ).pathname;
				
				if( pathname === '/login' ) {
					redirect( response, '/' );
				}
				else {
					onSuccess( info );
				}
			}
			else {
				onNoCredentials( request, response ); // invalid token
			}
		}
		else {
			onNoCredentials( request, response ); // incomplete information
		}
	}
	else {
		onNoCredentials( request, response ); // missing cookie
	}
}

exports.check = function( request, onSuccess, onFail ) {
	if( request.headers.cookie ) {
		var info = cookie.parse( request.headers.cookie );

		if( info.expiration && info.name && info.token ) {
			info = { 'expiration': info.expiration, 'name': info.name, 'token': info.token };

			if( tokenIsValid( info.expiration, info.name, info.token ) ) {
				onSuccess( info );
			}
			else {
				onFail( 'invalid token' );
			}
		}
		else {
			onFail( 'incomplete information' );
		}
	}
	else {
		onFail( 'missing cookie' );
	}
}

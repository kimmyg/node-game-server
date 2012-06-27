exports.parse = function( cookie ) {
	var cookies = {};

	var pairs = cookie.split( /;\ ?/ );

	for( var i = 0; i < pairs.length; ++i ) {
		var split_pair = pairs[i].split( '=' );

		cookies[ split_pair[0] ] = split_pair[1];
	}

	return cookies;
}

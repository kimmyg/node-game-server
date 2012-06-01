function NumberGuess( interface ) {
	var self = this;

	this.interface = interface;

	this.phase = NumberGuess.PHASE_SET;
	
}

NumberGuess.PHASE_SET = 0;
NumberGuess.PHASE_GUESS = 1;
NumberGuess.PHASE_DONE = 2;

NumberGuess.prototype.yy_set = function( sender, number ) {
	if( this.phase === NumberGuess.PHASE_SET ) {
		if( sender === 0 ) {
			this.phase = NumberGuess.PHASE_GUESS;
			this.number = number;
			this.state = 1;

			this.interface.notify( this.turn, 'It\'s your turn to guess.' );
		}
		else {
			this.interface.warn( sender, 'You are not the number setter.' );
		}
	}
	else {
		this.interface.warn( sender, 'You cannot set the number now.' );
	}
}

NumberGuess.prototype.yy_guess = function( sender, number ) {
	if( this.phase === NumberGuess.PHASE_GUESS ) {
		if( this.sender === 1 ) {
			if( this.state === 1 ) {
				this.interface.notify( 0, number );
				this.state = 0;
			}
			else {
				this.interface.warn( sender, 'Wait for feedback' );
			}
		}
		else {
			this.interface.warn( sender, 'You can't guess.' );
		}
	}
	else {
		this.interface.warn( sender, 'No guess can be made now.' );
	}
}

NumberGuess.prototype.declare = function( sender, declaration ) {
	if( this.phase === NumberGuess.PHASE_GUESS ) {
		if( this.sender === 0 ) {
			if( this.state === 0 ) {
				this.interface.notify( 1, declaration );
				this.state = 1;
			}
			else {
				this.interface.warn( sender, 'No guess yet' );
			}
		}
		else {
			this.interface.warn( sender, 'You can't declare.' );
	}
	else {
		this.interface.warn( sender, 'No declaration can be made now.' );
	}
}

NumberGuess.prototype.yy_higher = function( sender ) {
	this.declare( sender, 'higher' );
}

NumberGuess.prototype.yy_higher = function( sender ) {
	this.declare( sender, 'lower' );
}

NumberGuess.prototype.yy_correct = function( sender ) {
	this.declare( sender, 'correct' );
}

exports.NumberGuess = NumberGuess;

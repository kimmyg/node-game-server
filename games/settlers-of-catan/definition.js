/*

a game of Settlers of Catan consists of an initial phase 
and the game phase.

the initial phase is 2n turns where n is number of players. 
turns ascend and then descend through the order. each turn, 
a player places a settlement and a road adjacent to that 
settlement.

after the initial phase, each player is given resource cards.
each player has resource cards (five kinds), development cards, 
settlements, cities, and roads. each player also has a set of trading 
advantages.

the game is over when a player declares victory and has ten 
points.

*/

function Board() {

}

// location -> 1,2,3,4,...,Infinity
Board.prototype.distanceToNearestSettlement = function( location ) {

}

Board.prototype.resourcesAdjacentToIntersection = function( location ) {

}

Board.prototype.



function Core( n ) {
	this.n = n;
	
	this.players = new Array( n );
	
	for( var i = 0; i < n; ++i ) {
		this.players[i] = i;
	}
	
	// generate board
}

Core.prototype.start = function() {
	this.state = Core.INITIAL_PHASE_ASCENDING;
	this.substate = {
		turn_index: 0,
		turn: this.players[0],
		substate: {
			phase: 0,
			location: null
		}
	};
	
	this.startTurn();
}

Core.prototype.startTurn = function() {
	if( this.state === Core.INITIAL_PHASE_ASCENDING ) {
		this.emit( 'turn-start', this.substate.turn );
	}
	else if( this.state === Core.IN_GAME ) {
		this.emit( 'turn-start', this.substate.turn );
	}
	else {
		this.emit( 'critical', 'invalid state' );
	}
}

Core.prototype.msg_place = function( sender, parameters ) {
	if( this.state === Core.INITIAL_PHASE_ASCENDING ) {
		if( this.substate.turn === sender ) {
			if( this.substate.phase === 0 ) {
				if( parameters.type === Core.SETTLEMENT ) {
					if( distance_to_nearest_settlement( parameters.location ) < 2 ) {
						// can't build there
					}
					else {
						// place settlement there
						this.substate.phase = 1;
						this.substate.location = parameters.location;
						// this.emit( 'placement' )
					}
				}
				else {
					// wrong type
				}
			}
			else if( this.substate.phase === 1 ) {
				if( parameters.type === Core.ROAD ) {
					if( road_location_adjacent_to_settlement_location( parameters.location, this.substate.substate.location ) ) {
						// place road
						// emit road placement
						this.nextTurn();
					}
					else {
						// must place adjacent
					}
				}
				else {
					// wrong type
				}
			}
			else {
				// game logic error
			}
		}
		else {
			// not your turn
		}
	}
	else if( this.state === Core.IN_GAME ) {
		if( this.substate.turn === sender ) {
			if( this.substate.substate.bougt_whatever ) {
				if( far_enough_away() ) {
					// place and emit
					
					// if road
					// 	if has longest road
					//		emit longest road
	}
			if( this.board[ parameters.location ] ) {
				// already a settlement at location
			}
			else {
				//
		}
		else {
			// not turn
		}
	}
	else if( this.state === Core.IN_GAME ) {
		if( this.substate.turn === sender ) {
		
		}
		else {
			// not turn
		}
	}
	else {
		// not state
	}
}
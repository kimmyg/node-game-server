function Chat( id ) {
	this.id = id;
}

Chat.prototype.createElement = function() {
	var element = document.createElement( 'div' );
	
	element.id = this.id;
	
	var chat_log = document.createElement( 'div' );
	chat_log.className = 'chat-log';
	element.appendChild( chat_log );
	
	var message_text = document.createElement( 'input' );
	element.appendChild( message_text );
	
	var message_send = document.createElement( 'button' );
	message_send.setAttribute( 'disabled', 'disabled' );
	message_send.innerText = 'Send';
	element.appendChild( message_send );

	var self = this;

	var chat_text_had_content = false;
	
	var handle_content_change = function() {
		var chat_text_has_content = message_text.value.length > 0;
	
		if( chat_text_had_content ) {
			if( ! chat_text_has_content ) {
				message_send.setAttribute( 'disabled', 'disabled' );
				self.on_compose_cancel();
			}
		}
		else {
			if( chat_text_has_content ) {
				message_send.removeAttribute( 'disabled' );
				self.on_compose_start();
			}
		}
		
		chat_text_had_content = chat_text_has_content;
	};
	
	message_text.onkeydown = function( event ) {
		if( event.keyCode === 13 ) {
			if( chat_text_had_content ) {
				self.on_message_send( event.target.value );
				event.target.value = '';
				chat_text_had_content = false;
				message_send.setAttribute( 'disabled', 'disabled' );
			}
		}
		else {
			setTimeout( handle_content_change, 0 );
		}	
	};
			
	// set this button to disable when there's no content, but keep the check there
	message_send.onclick = function( event ) {
		if( message_text.value ) {
			self.on_message_send( message_text.value );
			message_text.value = '';
			chat_text_had_content = false;
		}
	};
	
	return element;
}

Chat.prototype.addMessage = function( sender, message ) {
	this.composeCancel( sender );
	
	var message_p = document.createElement( 'p' );
			
	var sender_span = document.createElement( 'span' );
	sender_span.className = 'sender';
	sender_span.innerText = sender;
	message_p.appendChild( sender_span );

	var message_span = document.createElement( 'span' );
	message_span.className = 'message';
	message_span.innerText = message;
	message_p.appendChild( message_span );

	$( this.id ).children[0].appendChild( message_p );
	
	$( this.id ).children[0].scrollTop = $( this.id ).children[0].scrollHeight;
}

Chat.prototype.composeStart = function( sender ) {
	var indicator_p = document.createElement( 'p' );
			
	indicator_p.className = 'subtle';
	indicator_p.id = this.id + '-' + sender + '-compose';	
	indicator_p.innerText = sender + ' is typing a message';

	$( this.id ).children[0].appendChild( indicator_p );

	$( this.id ).children[0].scrollTop = $( this.id ).children[0].scrollHeight;
}

Chat.prototype.composeCancel = function( sender ) {
	var compose_start = $( this.id + '-' + sender + '-compose' );
	
	if( compose_start ) {
		$( this.id ).children[0].removeChild( compose_start );
	}
}

//on_compose_start

//on_compose_cancel

//on_message_send
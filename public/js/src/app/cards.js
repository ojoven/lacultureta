/** CARDS **/
// Functions related to the Tinder like cards

// VARS
var stack,
	tresholdThrowCard = 140;

// LOGIC
$(document).ready(function() {

	generateCards();
	cardsLikeManagement();
});


// Functions
function generateCards() {

	// We're using the Swing JS plugin

	// Custom configuration
	var config = {
		throwOutConfidence: function(xOffset) {
			if (Math.abs(xOffset) > tresholdThrowCard ) {
				return 1;
			} else {
				return 0;
			}
		}
	};

	stack = gajus.Swing.Stack(config);

	[].forEach.call(document.querySelectorAll('.cards li'), function (targetElement) {
		stack.createCard(targetElement);

		targetElement.classList.add('in-deck');

	});

}

function cardsLikeManagement() {

	$("#viewport").on('out', function (e) {
		console.log(e.target.innerText || e.target.textContent, 'has been thrown out of the stack to the', e.throwDirection, 'direction.');

		e.target.classList.remove('in-deck');
	});

}
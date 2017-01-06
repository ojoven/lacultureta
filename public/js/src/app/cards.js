/** CARDS **/
// Functions related to the Tinder like cards

// VARS
var stack,
	cards = [],
	tresholdThrowCard = 140,
	currentCard = 0;

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
		var card = stack.createCard(targetElement);
		cards.push(card);
		console.log(card);

		targetElement.classList.add('in-deck');

	});

}

function cardsLikeManagement() {

	$("#viewport").on('out', function (e) {
		console.log(e.target);
		$(e.target).removeClass('in-deck');
	});

	$("#to-dislike").on('click', function() {
		cards[3].throwOut(-200, 0);
	});

}
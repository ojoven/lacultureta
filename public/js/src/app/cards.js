/** CARDS **/
// Functions related to the Tinder like cards

// VARS
var stack,
	cards = [],
	tresholdThrowCard = 140,
	category = 'Todos',
	page = 1,
	allEvents = false;

// LOGIC
$(document).ready(function() {

	generateCards();
	cardsLikeManagement();
	loadInitialCards();
});

function loadInitialCards() {

	loadCards(category, page);
}

function loadCards(category, page) {

	var url = '/api/getcards';
	var data = {};

	data.category = category;
	data.page = page;
	$.get(url, data, function(response) {

		if (response == '') {
			allEvents = true;
		}

		$(".cards").append(response);
		console.log('length',$(".cards li").not('.in-stack').length);
		$(".cards li").not('.in-stack').each(function() {
			$(this).addClass('in-stack').addClass('in-deck');
			stack.createCard($(this).get(0))
		});

	});
}


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

		$(targetElement).addClass('in-stack').addClass('in-deck');

	});

}

function cardsLikeManagement() {

	// Card thrown out
	$("#viewport").off().on('out', function (e, target, direction) {
		$(target).removeClass('in-deck');

		// If number of in-deck < numEventsPage, we load new page
		var numCardsInDeck = $('.cards li.in-deck').length;

		console.log(numCardsInDeck, allEvents);

		// We load new page
		if (numCardsInDeck < 4 && !allEvents) {
			page++;
			loadCards(category, page);
		}
	});

}
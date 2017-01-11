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

	var $viewport = $("#viewport");

	// Card thrown out
	$viewport.on('out', function (e, target, direction) {
		$(target).removeClass('in-deck');

		$('.like, .dislike').hide();

		// If number of in-deck < numEventsPage, we load new page
		var numCardsInDeck = $('.cards li.in-deck').length;

		// We load new page
		if (numCardsInDeck < 4 && !allEvents) {
			page++;
			loadCards(category, page);
		}
	});

	// Card move
	$viewport.on('panmove', function (e, params) {

		var progress = Math.abs(params.deltaX) / 200;

		if (params.deltaX > 0) {
			var selector = $(".like");
		} else {
			var selector = $(".dislike");
		}

		selector.show().css('opacity', progress).css('transform', 'translate(-50%, -50%) scale(' + progress + ')');
	});

	$viewport.on('panend', function (e, params) {
		$('.like, .dislike').hide();
	});
}
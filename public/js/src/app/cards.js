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

		// If all events have been loaded, we won't load more
		if (response == '') {
			allEvents = true;
		}

		// Append the cards to the HTML
		$(".cards").append(response);
		$(".cards li").not('.in-stack').each(function() {
			$(this).addClass('in-stack').addClass('in-deck');
			stack.createCard($(this).get(0));

			// Bind event
			$(".cards li").off('click').on('click', function() {

				var $cardSelector = $(this);
				if ($($cardSelector).hasClass('welcome')) return false; // Don't do anything for the moment for the welcome card

				// If event card
				prepareSingleEventPopup($cardSelector);
				showPopup();
			});
		});

	});
}

function prepareSingleEventPopup($cardSelector) {

	var $popupContainer = $('.popup-container');
	var $singleEvent = $(".single-event");

	$singleEvent.find('.title').html($cardSelector.find('.title').html()); // Title
	$singleEvent.find('.image').attr('style', 'background-image:url(' + $cardSelector.find('.image').data('image') + ')'); // Image
	$singleEvent.find('.description').html($cardSelector.find('.description').html()); // Description
	$singleEvent.find('.info').html($cardSelector.find('.info').html()); // Description

	$popupContainer.html(''); // empty the popup
	$singleEvent.clone().removeClass('hidden').appendTo($popupContainer);

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
		},
		minThrowOutDistance: 700,
		maxThrowOutDistance: 800
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

		// If number of in-deck < numEventsPage, we load new page
		var numCardsInDeck = $('.cards li.in-deck').length;

		// We load new page
		if (numCardsInDeck < 4 && !allEvents) {
			page++;
			loadCards(category, page);
		}
	});

}
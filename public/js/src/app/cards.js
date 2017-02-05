/** CARDS **/
// Functions related to the Tinder like cards

// VARS
var stack,
	cards = [],
	tresholdThrowCard = 140,
	category = ['all'],
	place = ['all'],
	date = ['all'],
	page = 1,
	allEvents = false,
	homeBackup = "",
	currentView = 'home';

// LOGIC
$(document).ready(function() {

	generateCards();
	cardsAfterThrowManagement();
	loadInitialCards();
	toChangeView();
});

function loadInitialCards() {

	loadCards(category, place, date, page);
}

function loadCards(category, place, date, page) {

	var url = '/api/getcards';
	var data = {};

	data.category = category;
	data.place = place;
	data.date = date;
	data.page = page;

	$.get(url, data, function(response) {

		// If all events have been loaded, we won't load more
		if (response == '') {
			allEvents = true;
		}

		// Append the cards to the HTML
		$(".cards").append(response);
		activateCards();

	});
}

function activateCards() {

	$(".card").not('.in-stack').each(function() {
		$(this).addClass('in-stack').addClass('in-deck');
		stack.createCard($(this).get(0));

		// Bind event
		$(".card").off('click').on('click', function() {

			var $cardSelector = $(this);
			if ($($cardSelector).hasClass('welcome')) return false; // Don't do anything for the moment for the welcome card

			// If event card
			prepareSingleEventPopup($cardSelector);
			showPopup($('#single-event-popup'));
		});
	});

}

function prepareSingleEventPopup($cardSelector) {

	var $singleEvent = $(".single-event");

	$singleEvent.find('.title').html($cardSelector.find('.title').html()); // Title
	$singleEvent.find('.image').attr('style', 'background-image:url(' + $cardSelector.find('.image').data('image') + ')'); // Image
	$singleEvent.find('.description').html($cardSelector.find('.description').html()); // Description
	$singleEvent.find('.info').html($cardSelector.find('.info').html()); // Description

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

function cardsAfterThrowManagement() {

	var $viewport = $("#viewport");

	// Card thrown out
	$viewport.on('out', function (e, target, direction) {
		$(target).removeClass('in-deck');

		// If number of in-deck < numEventsPage, we load new page
		var numCardsInDeck = $('.cards li.in-deck').length;

		// We load new page if in home, and not all events have been rendered
		if (numCardsInDeck < 4 && !allEvents && currentView == 'home') {
			page++;
			loadCards(category, place, date, page);
		}
	});

}

// LIKE / DISLIKE / BACK HOME
function toChangeView() {

	var $toChangeView = $('.to-change-view');
	$toChangeView.on('click', function() {

		var $cards = $('.cards');
		var $viewport = $('#viewport');

		var view = $(this).data('view'); // What view are we going to?
		currentView = $(this).data('view'); // This variable will be used for loading paginated cards (if we're in home)
		$viewport.removeClass().addClass(view); // We add the class to viewport, too
		$cards.html(''); // We clean the card list

		// If we return back to home, we load the previous set of cards from home
		if (view == 'home') {
			$cards.append(homeBackup);
			homeBackup = '';
			activateCards();
		} else {
			homeBackup = $cards.html(); // We save the current HOME status
			var likeDislike = ($(this).data('view') == 'like') ? 1 : -1;
			loadCardsLikeDislike(likeDislike);
		}

	});

}

function loadCardsLikeDislike(likeDislike) {

	var url = '/api/getcardsuser';
	var data = {};

	data.user_id = Cookies.get('userId');
	data.like_dislike = likeDislike;

	$.get(url, data, function(response) {

		// Append the cards to the HTML
		$(".cards").append(response);
		activateCards();

	});

}
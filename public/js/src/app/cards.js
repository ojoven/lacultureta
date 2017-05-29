/** CARDS **/
// Functions related to the Tinder like cards

// VARS
var stack,
	cards = [],
	cardList = [],
	tresholdThrowCard = 140,
	category = ['all'],
	place = ['all'],
	date = ['all'],
	page = 1,
	allEvents = false,
	homeEventIds = [],
	currentView = 'home';

// LOGIC
$(document).ready(function() {

	generateCards();
	throwCardsWithButtonsManagement();
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
		if (response.html === '') {
			allEvents = true;
		}

		// Save the cards to JS
		cardList = cardList.concat(response.cards);

		// Append the cards to the HTML
		$(".cards").append(response.html);
		activateCards();

	});
}

function activateCards() {

	$(".card").not('.in-stack').each(function() {
		$(this).addClass('in-stack').addClass('in-deck');
		var card = stack.createCard($(this).get(0));
		cards.push(card);

		// Bind event card
		$(".card.show-popup").off('click').on('click', function() {

			var $cardSelector = $(this);

			// If event card
			prepareSingleEventPopup($cardSelector);
			showPopup($('#single-event-popup'));
			gaCreateEvent(gaGetParamsCard($cardSelector, 'See Detail'));
		});

		// Bind not event card
		$(".card").not('.show-popup').off('click').on('click', function(e) {

			var $cardSelector = $(this);
			var $elementWhoTriggered = $( e.target );
			if (!$cardSelector.hasClass('clicked') && !$elementWhoTriggered.is('a') ) {
				$cardSelector.addClass('clicked');
				setTimeout(function() { $cardSelector.removeClass('clicked'); }, 1000);
			}
			var $link = $cardSelector.find('a');
			$link.off().on('click', function() {
				gaCreateEvent(gaGetParamsCard($cardSelector, 'Open Link'));
			});
		});
	});

	deactivateLoading();

}

function prepareSingleEventPopup($cardSelector) {

	var $singleEvent = $(".single-event");
	var eventId = $cardSelector.data('event');

	// Get the event from the JS
	var cardToShow = false;
	for (var i = 0; i < cardList.length; i++) {
		if (cardList[i].id == eventId) {
			cardToShow = cardList[i];
			break;
		}
	}

	$singleEvent.find('.title').html(cardToShow.title); // Title
	$singleEvent.find('.image').attr('style', 'background-image:url(' + cardToShow.image + ')'); // Image
	$singleEvent.find('.description').html(cardToShow.description); // Description

	var sourceHtml = '<p><a target="_blank" href="' + cardToShow.url + '">Enlace a ' + cardToShow.source + '</a></p>';
	$singleEvent.find('.info').html(cardToShow.info + sourceHtml); // Info

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

// THROW CARDS
function throwCardsWithButtonsManagement() {

	// FAV / LIKE
	var $fav = $(".favtrashbuttons .fav");
	$fav.on('click', function() {
		var randomPosition = randomIntFromInterval(-100, 100);
		cards[0].throwOut(1, randomPosition);
	});

	// TRASH / DISLIKE
	var $trash = $(".favtrashbuttons .trash");
	$trash.on('click', function() {
		var randomPosition = randomIntFromInterval(-100, 100);
		cards[0].throwOut(-1, randomPosition);
	});
}

function cardsAfterThrowManagement() {

	var $viewport = $("#viewport");

	// Card thrown out
	$viewport.on('out', function (e, target, direction) {
		$(target).removeClass('in-deck');

		// We remove the card from the cards list
		cards.shift();

		// If number of in-deck < numEventsPage, we load new page
		var $cardsInDeck = $('.cards li.in-deck');
		var numCardsInDeck = $cardsInDeck.length;

		// We add the active class to the card that is in front
		var $activeCard = $cardsInDeck.last();
		$cardsInDeck.removeClass('active').last().addClass('active');

		// We create a Google Analytics "see" event
		gaCreateEvent(gaGetParamsCard($activeCard, 'See Card'));

		// We load new page if in home, and not all events have been rendered
		if (numCardsInDeck < 4 && !allEvents && currentView == 'home') {
			page++;
			loadCards(category, place, date, page);
		}
	});

}

function getCategoryCard($card) {

	var classesCard = $card.attr('class');

	// Get the card category from its body class (event-card, ego-card...)
	var classCardAux = classesCard.split('-card');
	classCardAux = classCardAux[0].split(' ');
	classCardAux = classCardAux[classCardAux.length - 1];

	classCardAux = capitalizeFirstLetter(classCardAux);

	return classCardAux;
}

// LIKE / DISLIKE / BACK HOME
function toChangeView() {

	var $toChangeView = $('.to-change-view');
	$toChangeView.on('click', function() {

		var $cards = $('.cards');
		var $viewport = $('#viewport');
		var $iconSettings = $('.icon-settings');

		var view = $(this).data('view'); // What view are we going to?
		if (view == currentView) return false; // We don't do anything if the view is already loaded
		currentView = $(this).data('view'); // This variable will be used for loading paginated cards (if we're in home)
		$viewport.removeClass().addClass(view); // We add the class to viewport, too
		if (homeEventIds.length === 0) {
			homeEventIds = getHomeCardEventIds(); // We save the current HOME status (if not already saved)
		}
		$cards.html(''); // We clean the card list

		// If we return back to home, we load the previous set of cards from home
		if (view == 'home') {
			$iconSettings.fadeIn();
			loadCardsByEventIds(homeEventIds);
			homeEventIds = [];
		} else {
			$iconSettings.fadeOut();
			var likeDislike = ($(this).data('view') == 'like') ? 1 : -1;
			loadCardsLikeDislike(likeDislike);
		}

	});

}

function loadCardsByEventIds(eventIds) {

	activateLoading();

	var url = '/api/getcardsbyids';
	var data = {};
	data.eventIds = eventIds;

	$.get(url, data, function(response) {

		// Save the cards to JS
		cardList = cardList.concat(response.cards);

		// Append the cards to the HTML
		$(".cards").append(response.html);
		activateCards();

	});

}

function loadCardsLikeDislike(likeDislike) {

	activateLoading();

	var url = '/api/getcardsuser';
	var data = {};

	data.user_id = Cookies.get('userId');
	data.like_dislike = likeDislike;

	$.get(url, data, function(response) {

		// Append the cards to the HTML
		$(".cards").append(response.html);
		cards = [];
		activateCards();

	});

}

function getHomeCardEventIds() {

	var eventIds = [];
	var $cardItems = $('.card');
	$cardItems.each(function() {
		if ($(this).hasClass('in-deck') && typeof $(this).data('event') != "undefined") {
			eventIds.push($(this).data('event'));
		}
	});

	return eventIds;
}

function activateLoading() {

	var $loading = $('.loading');
	var $noCards = $('.no-cards');

	$loading.show();
	$noCards.hide(); // We hide this for some issues with z-index

}

function deactivateLoading() {

	var $loading = $('.loading');
	var $noCards = $('.no-cards');

	$loading.hide();
	$noCards.show();
}

function randomIntFromInterval(min, max) {
	return Math.floor(Math.random()*(max-min+1)+min);
}
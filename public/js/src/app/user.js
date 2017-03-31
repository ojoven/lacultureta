/** CARDS **/
// Functions related to the user

// VARS
var userId;

var $toUserSettings = $('.to-user-settings');

// LOGIC
$(document).ready(function() {

	// User ID and ratings
	userInitialManagement();
	userRatingsManagement();

	// User settings
	toShowUserSettings();
	toCloseUserSettings();
	settingsUserManagement();
});

// Initial Management (User ID)
function userInitialManagement() {

	// When the user is set, we get the ratings
	$(document).on('userSet', function() {

		// USER RATINGS
		var url = '/api/getratings';
		var data = {};
		data.user_id = Cookies.get('userId');
		console.log(data);
		$.get(url, data, function(response) {

			if (response.success) {
				Cookies.set('userRatings', response.ratings);
				updateNumberLikesDislikes();
			}

		});
	});

	// USER ID
	userId = Cookies.get('userId');
	if (!userId) {
		// We generate the user ID in the backend and save it to a cookie
		var url = '/api/createuser';
		var data = {}; // No data
		$.post(url, data, function(response) {

			if (response.success) {
				userId = response.userId;
				var inTenYears = 365 * 10;
				Cookies.set('userId', userId, { expires: inTenYears });

				// We throw an event so the system knows that the user is already set
				$(document).trigger('userSet');
			}

		});
	} else {
		$(document).trigger('userSet');
	}

}

// USER RATINGS: LIKE / DISLIKE
function userRatingsManagement() {

	var $viewport = jQuery('#viewport');
	$viewport.on('out', function (e, target, direction) {

		var data = {};
		data.rating = direction;
		data.userId = userId;
		data.eventId = jQuery(target).data('event');

		// If the card is an event
		if (data.eventId) {

			// We save the like / dislike in DB
			var url = '/api/rate';
			$.post(url, data, function(response) {
				//console.log(response);
			});

			// We save the like / dislike in cookies
			addRatingToCookies(data.eventId, direction);
		}

	});

}

function addRatingToCookies(eventId, rating) {

	var userRatings = getUserRatingsFromCookies();
	var alreadyRated = false;

	// We loop over the user ratings
	for (var i = 0; i < userRatings.length; i++) {
		if (userRatings[i].eventId == eventId) {
			userRatings[i].rating = rating;
			alreadyRated = true;
		}
	}

	if (!alreadyRated) {
		var ratingObject = {};
		ratingObject.eventId = eventId;
		ratingObject.rating = rating;

		userRatings.push(ratingObject);
	}

	// We set back the user ratings
	Cookies.set('userRatings', userRatings);
	updateNumberLikesDislikes();

	// We add animation
	var $toBeAnimated = (rating == 1) ? $('.like') : $('.dislike');
	$toBeAnimated.addClass('animate');
	setTimeout(function() {
		$toBeAnimated.removeClass('animate'); // We remove the animate class, so the effect works the next time
	}, 1100);
}

function updateNumberLikesDislikes() {

	var userRatings = getUserRatingsFromCookies();
	var likes = 0;
	var dislikes = 0;
	userRatings.forEach(function(ratingObject) {
		if (ratingObject.rating == 1) {
			likes++;
		} else {
			dislikes++;
		}
	});

	// Now we update the numbers of the HTML
	var $dislikesNum = $('.dislike .num');
	var $likesNum = $('.like .num');

	$dislikesNum.html(dislikes);
	$likesNum.html(likes);

}

function getUserRatingsFromCookies() {

	var userRatingsJson = Cookies.get('userRatings');
	var userRatings = JSON.parse(userRatingsJson);
	return userRatings;
}

/** USER SETTINGS **/
function toShowUserSettings() {

	// Show settings popup
	$toUserSettings.on('click', function() {

		showPopup($("#user-settings-popup"));
		return false;
	});

}

function settingsUserManagement() {

	// Change language
	var $selectLanguage = $('.select-language');
	$selectLanguage.on('click', function() {
		$selectLanguage.removeClass('active');
		$(this).addClass('active');
	});

	// Save settings
	var $saveSettings = $('#user-settings-popup .save-settings');
	$saveSettings.on('click', function() {

		// Save language
		var $selectLanguageActive = $('.select-language.active');
		var languageSelected = $selectLanguageActive.attr('data-language');

		// We set the cookie and reload the page
		Cookies.set('language', languageSelected);
		window.location.reload(true);

	});

}

function toCloseUserSettings() {

	var $closeSettings = $('.close-settings');
	$closeSettings.on('click', function() {
		closePopup();
	});
}
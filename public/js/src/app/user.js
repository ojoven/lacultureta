/** CARDS **/
// Functions related to the user

// VARS
var userId;

// LOGIC
$(document).ready(function() {

	userInitialManagement();
	userRatingsManagement();
});

// Initial Management (User ID)
function userInitialManagement() {

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
			}

		});
	}

	// USER RATINGS
	var userRatingsJson = Cookies.get('userRatings');
	//if (!userRatingsJson) {
	if (1) {

		var url = '/api/getratings';
		var data = {};
		data.user_id = userId;
		$.get(url, data, function(response) {

			console.log('ratings', response);

			if (response.success) {
				Cookies.set('userRatings', response.ratings);

				var test = Cookies.get('userRatings');
				console.log(JSON.parse(test));
			}

		});

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
				console.log(response);
			});

			// We save the like / dislike in cookies
			addRatingToCookies(data.eventId, direction);
		}

	});

}

function addRatingToCookies(eventId, rating) {

	var userRatingsJson = Cookies.get('userRatings');
	var userRatings = JSON.parse(userRatingsJson);
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

}

/** CARDS **/
// Functions related to the user

// VARS
var userId;

// LOGIC
$(document).ready(function() {

	userInitialManagement();
	userLikeDislikeManagement();
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
				Cookies.set('userId', userId);
			}

		});
	}

	// USER LIKES
	userLikes = Cookies.get('userLikes');
	if (!userLikes) {

	}


	// USER DISLIKES
}

// USER LIKE / DISLIKE
function userLikeDislikeManagement() {

	var $viewport = jQuery('#viewport');
	$viewport.on('out', function (e, target, direction) {

		var data = {};
		data.like = direction;
		data.userId = userId;
		data.eventId = jQuery(target).data('event');

		// If the card is an event
		if (data.eventId) {

			// We save the like / dislike in DB
			var url = '/api/like';
			$.post(url, data, function(response) {
				console.log(response);
			});

			// We save the like / dislike in cookies

		}

	});

}

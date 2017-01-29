/** CARDS **/
// Functions related to the user

// VARS
var $toUser = $('.to-user');

var userId;

// LOGIC
$(document).ready(function() {

	userInitialManagement();
	toShowUser();
});

function userInitialManagement() {

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

}

function toShowUser() {


}

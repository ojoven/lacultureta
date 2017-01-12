/** CARDS **/
// Functions related to the Tinder like cards

// VARS
var $toSettings = $('.to-settings'),
	$popup = $('.popup'),
	$viewport = $('#viewport');

// LOGIC
$(document).ready(function() {

	showSettings();
});

function showSettings() {

	// Show settings popup
	$toSettings.on('click', function() {

		showPopup();
		// Fill popup with settings
		return false;

	});

}

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

	var viewportOffset = $viewport.offset();
	$popup.width($viewport.width()).css('left', viewportOffset.left).css('top', viewportOffset.top);

	// Show settings popup
	$toSettings.on('click', function() {

		$popup.css('visibility', 'visible').addClass('active');
		return false;

	});

	// Hide settings popup
	$popup.on('click', function() {
		$popup.removeClass('active');
		setTimeout(function() {
			$popup.css('visibility', 'hidden');
		}, 300);
		return false;
	});
}

/** CARDS **/
// Functions related to the Tinder like cards

// VARS
var $popupClose = $('.popup .popup-close'),
	$viewport = $('#viewport');

// LOGIC
$(document).ready(function() {

	preparePopupOnLoad();
	popupCloseManagement();
});

function preparePopupOnLoad() {

	var viewportOffset = $viewport.offset();
	$popup.width($viewport.width()).css('left', viewportOffset.left).css('top', viewportOffset.top);
}

function showPopup($popup) {

	$popup.css('visibility', 'visible').addClass('active');
	return false;
}

function popupCloseManagement() {

	$popupClose.on('click', function() {
		closePopup();
	});
}

function closePopup() {

	$popup.removeClass('active');
	setTimeout(function() {
		$popup.css('visibility', 'hidden');
	}, 300);
	return false;

}

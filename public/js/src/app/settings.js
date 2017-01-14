/** CARDS **/
// Functions related to the Tinder like cards

// VARS
var $toSettings = $('.to-settings'),
	$popup = $('.popup'),
	$viewport = $('#viewport');

// LOGIC
$(document).ready(function() {

	toShowSettings();
	//showPopup($("#settings-popup"));
	settingsManagement();
});

function toShowSettings() {

	// Show settings popup
	$toSettings.on('click', function() {

		showPopup($("#settings-popup"));
		return false;
	});

}

function settingsManagement() {

	// Settings
	var $setting = $('.settings .filter');
	$setting.on('click', function() {
		if ($(this).hasClass('active')) {
			$(this).removeClass('active');
		} else {
			$(this).addClass('active');
		}
	});

	// Select / Deselect all
	var $selectAll = $('.settings .select-all');
	var $deselectAll = $('.settings .deselect-all');

	$selectAll.on('click', function() {
		console.log('deselect');
		$(this).closest('.section').find('.filter').addClass('active');
	});

	$deselectAll.on('click', function() {
		console.log('select');
		$(this).closest('.section').find('.active').removeClass('active');
	});

	// Save settings
	var $saveSettings = $('.save-settings');
	$saveSettings.on('click', function() {
		closePopup();
	});

}

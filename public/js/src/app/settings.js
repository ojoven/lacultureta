/** CARDS **/
// Functions related to the Tinder like cards

// VARS
var $toSettings = $('.to-settings'),
	$popup = $('.popup');

// LOGIC
$(document).ready(function() {

	toShowSettings();
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

	var $dataCategory = $('.data-category'),
		$dataPlace = $('.data-place'),
		$dataDate = $('.data-date');

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
		$(this).closest('.section').find('.filter').addClass('active');
	});

	$deselectAll.on('click', function() {
		$(this).closest('.section').find('.active').removeClass('active');
	});

	// Save settings
	var $saveSettings = $('.save-settings');
	$saveSettings.on('click', function() {

		// Make a new search with the parameters

		// Remove all current cards
		$(".cards").html('');

		// Category
		category = [];
		// If all categories are selected we'll just use 'all'
		if ($dataCategory.find('.active').length == $dataCategory.find('.filter').length) {
			category.push('all');
		} else {
			$dataCategory.find('.active').each(function() {
				category.push($(this).data('value'));
			});
		}

		// Place
		place = [];
		// If all categories are selected we'll just use 'all'
		if ($dataPlace.find('.active').length == $dataPlace.find('.filter').length) {
			place.push('all');
		} else {
			$dataPlace.find('.active').each(function() {
				place.push($(this).data('value'));
			});
		}

		// Date
		date = [];
		$dataDate.find('.active').each(function() {
			date.push($(this).data('value'));
		});

		var page = 1;
		loadCards(category, place, date, page);
		closePopup();
	});

}

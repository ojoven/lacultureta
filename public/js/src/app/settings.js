/** CARDS **/
// Functions related to the Tinder like cards

// VARS
var $toSettings = $('.to-settings'),
	$popup = $('.popup');

// LOGIC
$(function () {

	toShowSettings();
	toCloseSettings();
	settingsManagement();
	dateManagement();
});

function toShowSettings() {

	// Show settings popup
	$toSettings.on('click', function () {

		showPopup($("#settings-popup"));
		return false;
	});

}

function dateManagement() {

	$.datepicker.regional['es'] = {
		prevText: '<',
		nextText: '>',
		monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
			'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
		monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
			'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dec'],
		dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
		dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
		dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
		dateFormat: 'yy-mm-dd', firstDay: 1
	};

	$.datepicker.regional['eu'] = {
		prevText: '<',
		nextText: '>',
		monthNames: ['Urtarrila', 'Otsaila', 'Martxoa', 'Apirila', 'Maiatza', 'Ekaina',
			'Uztaila', 'Abuztua', 'Iraila', 'Urria', 'Azaroa', 'Abendua'],
		monthNamesShort: ['Urt', 'Ots', 'Mar', 'Api', 'Mai', 'Eka',
			'Uzt', 'Abu', 'Ira', 'Urr', 'Aza', 'Abe'],
		dayNames: ['Igandea', 'Astelehena', 'Asteartea', 'Asteazkena', 'Osteguna', 'Ostirala', 'Larunbata'],
		dayNamesShort: ['Iga', 'Leh', 'Art', 'Azk', 'Oste', 'Osti', 'Lar'],
		dayNamesMin: ['Ig', 'As', 'As', 'As', 'Os', 'Os', 'La'],
		dateFormat: 'yy-mm-dd', firstDay: 1
	};

	$.datepicker.setDefaults($.datepicker.regional[language]);

	var $dateInput = $('#date-selector');
	$dateInput.multiDatesPicker({
		inline: true,
		minDate: 0,
		altField: '#data-date'
	});
}

function settingsManagement() {

	var $dataCategory = $('.data-category'),
		$dataPlace = $('.data-place'),
		$dataDate = $('#data-date'); // Special, date picker

	// Load saved settings from localStorage when the page loads
	loadSavedSettings();

	// Settings
	var $setting = $('.settings .filter');
	$setting.on('click', function () {
		if ($(this).hasClass('active')) {
			$(this).removeClass('active');
		} else {
			$(this).addClass('active');
		}
	});

	// Select / Deselect all
	var $selectAll = $('.settings .select-all');
	var $deselectAll = $('.settings .deselect-all');

	$selectAll.on('click', function () {
		$(this).closest('.section').find('.filter').addClass('active');
	});

	$deselectAll.on('click', function () {
		$(this).closest('.section').find('.active').removeClass('active');
	});

	// Save settings
	var $saveSettings = $('#settings-popup .save-settings');
	var $settingsError = $('#settings-popup .settings-error');
	$saveSettings.on('click', function () {

		activateLoading();

		// Remove all current cards
		$(".cards").html('');

		// Category
		category = [];
		// If all categories are selected we'll just use 'all'
		if ($dataCategory.find('.active').length == $dataCategory.find('.filter').length) {
			category.push('all');
		} else {
			$dataCategory.find('.active').each(function () {
				category.push($(this).data('value'));
			});
		}

		// Place
		place = [];
		// If all categories are selected we'll just use 'all'
		if ($dataPlace.find('.active').length == $dataPlace.find('.filter').length) {
			place.push('all');
		} else {
			$dataPlace.find('.active').each(function () {
				place.push($(this).data('value'));
			});
		}

		// Date
		date = [];
		var dateVal = $dataDate.val();
		if (!dateVal) {
			date.push('all');
		} else {
			date = dateVal.split(',');
		}

		// We validate
		if (category.length === 0 || place.length === 0) {
			$saveSettings.fadeOut(300, function () {
				$settingsError.fadeIn(300, function () {
					setTimeout(function () {
						$settingsError.fadeOut(300, function () {
							$saveSettings.fadeIn(300);
						});
					}, 1300);
				});
			});
			return false;
		}

		// Save settings to localStorage
		saveSettingsToLocalStorage(category, place, date);

		page = 1;
		loadCards(category, place, date, page);
		closePopup();
	});

	// Function to save settings to localStorage
	function saveSettingsToLocalStorage(category, place, date) {
		var settings = {
			category: category,
			place: place,
			date: date
		};
		localStorage.setItem('eventSettings', JSON.stringify(settings));
	}

	// Function to load saved settings from localStorage
	function loadSavedSettings() {
		var savedSettings = localStorage.getItem('eventSettings');

		if (!savedSettings) {
			// If no saved settings, all filters are active by default (as in the original code)
			return;
		}

		try {
			var settings = JSON.parse(savedSettings);

			// Apply category settings
			if (settings.category && settings.category.length > 0) {
				// First deselect all
				$dataCategory.find('.filter').removeClass('active');

				// If 'all' is selected, select all categories
				if (settings.category.includes('all')) {
					$dataCategory.find('.filter').addClass('active');
				} else {
					// Otherwise, select only the saved categories
					settings.category.forEach(function (categoryId) {
						$dataCategory.find('.filter[data-value="' + categoryId + '"]').addClass('active');
					});
				}
			}

			// Apply place settings
			if (settings.place && settings.place.length > 0) {
				// First deselect all
				$dataPlace.find('.filter').removeClass('active');

				// If 'all' is selected, select all places
				if (settings.place.includes('all')) {
					$dataPlace.find('.filter').addClass('active');
				} else {
					// Otherwise, select only the saved places
					settings.place.forEach(function (placeName) {
						$dataPlace.find('.filter[data-value="' + placeName + '"]').addClass('active');
					});
				}
			}

			// Apply date settings
			if (settings.date && settings.date.length > 0 && !settings.date.includes('all')) {
				$dataDate.val(settings.date.join(','));
				// Note: You might need additional code to update the date picker UI
				// depending on how your date picker works
			}

		} catch (e) {
			console.error('Error loading saved settings:', e);
			// If there's an error parsing the saved settings, continue with default settings
		}
	}
}

function toCloseSettings() {

	var $closeSettings = $('.close-settings');
	$closeSettings.on('click', function () {
		closePopup();
	});
}

/** CARDS **/
// Functions related to the Tinder like cards

// VARS
var $toSettings = $('.to-settings'),
	$popup = $('.popup');

// LOGIC
$(document).ready(function() {

	toShowSettings();
	toCloseSettings();
	settingsManagement();
	dateManagement();
});

function toShowSettings() {

	// Show settings popup
	$toSettings.on('click', function() {

		showPopup($("#settings-popup"));
		return false;
	});

}

function dateManagement() {

	$.datepicker.regional['es'] = {
		prevText: '<',
		nextText: '>',
		monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
			'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
		monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun',
			'Jul','Ago','Sep','Oct','Nov','Dec'],
		dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
		dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
		dayNamesMin: ['Do','Lu','Ma','Mi','Ju','Vi','Sá'],
		dateFormat: 'yy-mm-dd', firstDay: 1};

	$.datepicker.regional['eu'] = {
		prevText: '<',
		nextText: '>',
		monthNames: ['Urtarrila','Otsaila','Martxoa','Apirila','Maiatza','Ekaina',
			'Uztaila','Abuztua','Iraila','Urria','Azaroa','Abendua'],
		monthNamesShort: ['Urt','Ots','Mar','Api','Mai','Eka',
			'Uzt','Abu','Ira','Urr','Aza','Abe'],
		dayNames: ['Igandea','Astelehena','Asteartea','Asteazkena','Osteguna','Ostirala','Larunbata'],
		dayNamesShort: ['Iga','Leh','Art','Azk','Oste','Osti','Lar'],
		dayNamesMin: ['Ig','As','As','As','Os','Os','La'],
		dateFormat: 'yy-mm-dd', firstDay: 1};

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
	var $saveSettings = $('#settings-popup .save-settings');
	var $settingsError = $('#settings-popup .settings-error');
	$saveSettings.on('click', function() {

		activateLoading();

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
		var dateVal = $dataDate.val();
		if (!dateVal) {
			date.push('all');
		} else {
			date = dateVal.split(',');
		}

		// We validate
		if (category.length === 0 || place.length === 0) {
			$saveSettings.fadeOut(300, function() {
				$settingsError.fadeIn(300, function() {
					setTimeout(function() {
						$settingsError.fadeOut(300, function() {
							$saveSettings.fadeIn(300);
						});
					}, 1300);
				});
			});
			return false;
		}

		page = 1;
		loadCards(category, place, date, page);
		closePopup();
	});

}

function toCloseSettings() {

	var $closeSettings = $('.close-settings');
	$closeSettings.on('click', function() {
		closePopup();
	});
}

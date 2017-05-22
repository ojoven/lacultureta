/** GOOGLE ANALYTICS **/
// Functions related to Google Analytics

function gaGetParamsCard($cardSelector, action) {

	params = {};
	params.category = getCategoryCard($cardSelector);
	params.action = action;
	params.label = $cardSelector.find('.title').text();

	return params;
}

// Simple interface for GA create event
function gaCreateEvent(params) {
	ga('send', 'event', params.category, params.action, params.label);
}
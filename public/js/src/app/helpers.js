/** CARDS **/
function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

/** SERVICE WORKER **/
// Needed for PWA
if ('serviceWorker' in navigator) {

	// register service worker
	navigator.serviceWorker.register('/service-worker.js');

}
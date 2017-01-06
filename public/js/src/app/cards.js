/** CARDS **/
// Functions related to the Tinder like cards

// VARS
var stack;

// LOGIC
$(document).ready(function() {

	generateCards();
	cardsLikeManagement();
});

// Functions
function generateCards() {

	// We're using the Swing JS plugin
	stack = gajus.Swing.Stack();

	[].forEach.call(document.querySelectorAll('.cards li'), function (targetElement) {
		stack.createCard(targetElement);

		targetElement.classList.add('in-deck');
	});

}

function cardsLikeManagement() {

	stack.on('throwout', function (e) {
		console.log(e.target.innerText || e.target.textContent, 'has been thrown out of the stack to the', e.throwDirection, 'direction.');

		e.target.classList.remove('in-deck');
	});

}
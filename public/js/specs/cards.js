/** CARDS TEST SUITE **/

describe("Cards", function() {

	var eventIds = [475, 944];

	it("should make an AJAX request to the correct URL", function() {

		spyOn($, "ajax");
		loadCardsByEventIds(eventIds);
		expect($.ajax.calls.mostRecent().args[0]["url"]).toEqual("/api/getcardsbyids");
	});

	it("should execute the callback function on success", function () {

		spyOn($, "ajax").and.callFake(function(options) {
			options.success();
		});
		var callback = jasmine.createSpy();
		loadCardsByEventIds(eventIds, callback);
		expect(callback).toHaveBeenCalled();
	});

});
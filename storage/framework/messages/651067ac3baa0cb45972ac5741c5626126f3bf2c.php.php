// Let's render an screenshot with PhantomJS

// Get the url of the tweet to render via console argument
var system = require('system');
var url = system.args[1];
var filePath = system.args[2];
var extension = system.args[3];

var page = require('webpage').create();

// For logging errors
page.onResourceError = function(resourceError) {
    page.reason = resourceError.errorString;
    page.reason_url = resourceError.url;
};

page.open(url, function (status) {
    if (status !== 'success') {
        console.log(
            "Error opening url \"" + page.reason_url
            + "\": " + page.reason
        );
        phantom.exit(1);

    } else {
        window.setTimeout(function () {

            page.viewportSize = {
                width: 1200,
                height: 1000
            };

            var bb = page.evaluate(function () {
                return document.getElementById("resume").getBoundingClientRect();
            });

            page.clipRect = {
                top:    bb.top,
                left:   bb.left,
                width:  bb.width,
                height: bb.height
            };

            page.render(filePath, { format: extension }); // Phantom creates the images much faster in jpg but avconv creates corrupted video if JPG inputs
            console.log('success');
            phantom.exit();

        }, 1000);
    }
});

phantom.onError = function(msg, trace) {
    var msgStack = ['PHANTOM ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
        });
    }
    console.error(msgStack.join('\n'));
    phantom.exit(1);
};
'use strict';

// Extra node modules
var https = require('https');


module.exports = function(grunt) {

    // Function to send the actual request of https
    function sendRequest(options, dest, callback) {

        // Make the request
        var req = https.request(options, function(res) {

            // Returned JSON
            var output = "";
            res.setEncoding('utf8');

            // Pull the returned date into a variable
            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function() {

                // Check to see if a screen dump flag is true
                if (options.screenDump) {
                    grunt.log.writeln(output);
                }

                // Check to see if a dest file is defined is so output it
                if (dest) {
                    grunt.file.write(dest, output);
                    grunt.log.writeln("File: " + dest + " was created!");
                }

                callback(true);

            });

        });

        req.on('error', function(err) {
            grunt.log.writeln(err.message);
        });

        // End the request
        req.end();

    }

    // Function to build the request url parameters
    function buildReq(paramObj, manyParamCheck) {

        var path = "";

        // Loop through all parameter and add them to the path
        for (var param in paramObj) {

            // Check if its the first item
            if (!manyParamCheck) {
                path += param + "=" + paramObj[param];
                manyParamCheck = true;

            } else {
                path += "&" + param + "=" + paramObj[param];
            }
        }

        return path;
    }

    // Setup the new multi task
    grunt.registerMultiTask('github', 'Simple Script to query the github API.', function() {

        // Override options
        var options = this.options({
            host: 'api.github.com',
            path: '',
            method: 'GET',
            headers: {
                'User-Agent': 'node-http/0.10.1',
                'Content-Type': 'application/json'
            },
            filters: {},
            oAuth: {},
            screenDump: false
        });

        var cb = this.async();

        // Loop through all the defined tasks.
        this.files.forEach(function(f) {

            var path = "?",
                manyPrarams = false,
                taskOptions = options;

            // Check to see if the filter have been defined
            if (Object.keys(taskOptions.filters).length > 0) {

               path += buildReq(taskOptions.filters, manyPrarams);

               // If we are here then at least on filter was defined and added. Set to true
               manyPrarams = true;

            }

            // Check to see if there us an oAuth Token defined. (Tags on the parameters)
            if (Object.keys(taskOptions.oAuth).length > 0) {

                path += buildReq(taskOptions.oAuth, manyPrarams);

            }

            // Add the new path to the taskOptions
            taskOptions.path = f.orig.src + path;

            sendRequest(taskOptions, f.orig.dest, cb);


        });

    });


};

'use strict';

// Extra node modules
var https = require('https');
var fs = require('fs');


module.exports = function(grunt) {

    /*
     * Function writes the pure output returned from the request NO ENCODING CHANGES
     *
     * @param {object} | options - grunt github tasks properties
     * @param {string} | dest - destination for contents being saved to disk
     * @param {function} | callback - grunt asyn callback function
     */
    function sendRequest(options, dest, callback) {

        // Make the request
        var req = https.request(options, function(res) {

            // Returned JSON
            var output = "";
            res.setEncoding('utf8');

            // Function to collect the data as the chunks appear.
            res.on('data', function (chunk) {
                output += chunk;
            });

            // Function that runs when all the requested data has been returned.
            res.on('end', function() {

                // Check to see if a screen dump flag is true
                if (options.screenDump) {
                    grunt.log.writeln(output);
                }

                // Check to see if a dest file is defined is so output it
                if (dest) {
                    
                    // Check to see what the user expected back (data or a file).
                    if (options.reqType === "file") {

                        // Call write file function
                        writeFile(dest, output, options.fileEncode);

                    } else {

                        // Call function to write the native data that was returned
                        writeRaw(dest, output);

                    }

                    // Let the user know that the write was successful
                    grunt.log.writeln("File: " + dest + " was created!");

                }

                // Return the async callback as true.
                callback(true);

            });

        });

        // Request failed! Let the user know
        req.on('error', function(err) {
            grunt.log.writeln(err.message);
        });

        // End the request
        req.end();

    }

    /*
     * Function writes the pure output returned from the request NO ENCODING CHANGES
     *
     * @param {string} | dest - file output destination path and name
     * @param {object} | output - json returned from github.
     */
    function writeRaw(dest, output) {
        grunt.file.write(dest, output);
    }

    /*
     * Function writes the contents of the requested file.
     *
     * @param {string} | dest - file output destination path and name
     * @param {object} | output - json returned from github.
     * @param {string} | encode - desired file encoding type.
     */
    function writeFile(dest, output, encode) {

        // Convert the requested response into a usable object then create a
        // buffer to switch the content from one encoding type to another (encode)
        var requestedFile = JSON.parse(output),
            buffer = new Buffer(requestedFile.content, requestedFile.encoding).toString(encode);

        // Write the properly encode file to disk
        grunt.file.write(dest, buffer);

    }

    /*
     * Function to build the query object
     *
     * @param {object} | paramObj - object containing all of the differnt parameters
     * @param {boolean} | manyParamCheck - simple flag to determine the appended parameters content.
     */
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
            screenDump: false,
            reqType: "data",
            fileEncode: "utf8"
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

'use strict';

// Extra node modules
var https = require('https');
var fs = require('fs');

module.exports = function(grunt) {

    var github_api = require('./lib/api');

    // Setup the new multi task
    grunt.registerMultiTask('github', 'Simple Script to query the github API.', function() {

        var requestQueue = [];
        var done = this.async();

        // Task Functions
        //=============================================================================================================

        var generateRequests = function(github_api, next) {

            //console.log(github_api.taskDetails)

            //console.log(github_api);

            var taskDetails = github_api.taskDetails,
                taskData = taskDetails.data,
                taskOptions = taskDetails.options;

                //console.log(taskOptions);

            if (taskOptions.task.action === "request") {

                var src = false,
                    request = false;

                // Check to make sure a source is defined
                if (taskData.src) {
                    src = taskData.src;
                }

                if (!src || src.length == 0) {
                    grunt.warn('No source was defined for ' + github_api.name);
                    done(false);
                }

                // Check to see if we have a common request type (for multi data requests)
                if (taskData.request) {
                    request = taskData.request;
                }

                var parameters = false;

                // Check for additional filters and oAuth
                if (taskOptions.oAuth || taskOptions.filters) {

                    parameters = parameterBuilder(taskOptions.oAuth, taskOptions.filters);

                }


                // Generate request paths from source
                if (request) {

                    // Check to see if the source is an array or string to handle the cleanup appropriately
                    if (grunt.util.kindOf(src) === "array") {

                        for (var i = 0, len = src.length; i < len; i++ ) {


                            src[i] = sourceCleanup(src[i], request);

                        }

                    } else {

                        src = sourceCleanup(src, request);
                    }


                }

                // Finally add parameters to the request path if they exist
                if (parameters) {

                    for (var i = 0, len = src.length; i < len; i++ ) {
                        src[i] += "?" + parameters;
                    }

                }

                // check to see if a user added a common request for multiple source
                if (taskOptions.task.concat) {

                } else {

                    if (grunt.util.kindOf(src) === "array") {
                        for (var i = 0, len = src.length; i < len; i++ ) {
                            requestQueue.push([src[i], taskOptions.connection, taskDetails]);
                        }
                    } else {
                        requestQueue.push([src, taskOptions.connection, taskDetails]);
                    }

                }

            }

            // Move to the next step
            next(github_api);
        };

        var sendRequests = function(github_api, next) {

            //console.log(requestQueue);

            if (requestQueue.length !== 0) {

                var collection = [];

                (function connect(requestQueue, collection) {

                    var request = requestQueue.shift();

                    request[1].path = request[0];

                    var req = https.request(request[1], function(res) {

                        var data = "";
                        res.setEncoding('utf8');

                        res.on('data', function (chunk) {
                            data += chunk;
                        });

                        res.on('end', function() {

                            collection.push(data);

                            //console.log(data);

                            // If there is nothing else to do go and prep the data that needs to be written
                            if (requestQueue.length === 0) {

                                prepDataWrite(github_api, collection, request[2], function(){

                                    // Noting was left move to the next step.
                                    next(github_api);

                                });

                            // Check to see if the data is suppose to be seperated.
                            } else if (requestQueue.length > 0 && request[2].options.task.concat === false) {

                                prepDataWrite(github_api, collection, request[2], function() {

                                    // Flush the collection as it was sent for writting
                                    collection = [];

                                    // Continue to the next request
                                    connect(requestQueue, collection);
                                });

                            } else {

                                // Continue to the next request
                                connect(requestQueue, collection);

                            }

                        });

                    });

                    req.on('error', function(e){
                        console.log(e);
                    })

                    req.end();

                })(requestQueue, collection);

            } else {

                // Move to the next task if no requests exist.
                next(github_api);
            }

        };

        var saveCache = function(github_api, next) {

            var cacheData = github_api.cache.getAll();

            if (cacheData.changed) {

                writeJSONFile(cacheData.location, cacheData.contents, false);

            }

            // Move to the next step
            next(github_api);

        }

        // Process stepper and executer.
        //=============================================================================================================

        var process = github_api.init(this, grunt)
            .step(generateRequests)
            .step(sendRequests)
            .step(saveCache)
            .execute(function(err, results) {

                if(err) {
                    grunt.warn(err);
                    done(false);
                }

                done();

            });

    });

    // Helper Functions
    //=============================================================================================================

    var parameterBuilder = function () {
        // go through and loop
        var temp = [];

        for (var i=0; i<arguments.length; i++) {

            if (arguments[i]) {

                for (var item in arguments[i]) {

                    temp.push(item + "=" + arguments[i][item]);

                }

            }

        }

        return temp.join("&");

    };

    var prepDataWrite = function(github_api, collection, requestOptions, cb) {

        //console.log(requestOptions);

        // first determine if we are handling data or a file.
        if (requestOptions.options.task.type === "data") {

            console.log("Data request");

        } else {

            // We are not allowing the concatination of raw files so get the data out of collection.
            var file = JSON.parse(collection[0]),
                origFilename = file.name,
                unqiueId = file.sha,
                origSrc = file.html_url,
                dest = false,
                cacheName = false;

            // We will allow direct 1-to-1 overwriting of file name. so if one source is defined and one destination is defined
            // we will override the output name to match the user defined.
            if (requestOptions.data.dest && kindOf(requestOptions.data.dest) == "string") {

                dest = requestOptions.data.dest;

            } else {

                // For simplcity sake we are going to build the filename from metadate returned by the API
                dest = destinationCleanup(origSrc);
            }

            // Get a cache name
            cacheName = (dest.split(".")[0]);

            // Check cache settings to determine if we care about keeping cache info on this task at all.
            if (requestOptions.options.task.cache) {

                var writeFile = true,
                    cacheData = github_api.cache.get(requestOptions.name, cacheName);

                if (cacheData) {

                    console.log(cacheData);

                } else {

                    // Set the data.
                    github_api.cache.set(requestOptions.name, cacheName, "file", unqiueId);

                }

            } else {

                // Ignoring cache on this task. Simply write the data.
                writeData(dest, file.content, 'utf8');

            }

        }


        cb();

    };

    var sourceCleanup = function (src, request) {

        // Check to see if source has a ending "/" if not add it
        if (src.charAt(src.length-1) !== "/") {
            src += "/";
        }

        // Check to see if the request type has a leading "/" and remove it
        if (request.charAt(0) === "/") {
            request = request.substring(1);
        }

        // Remove any trailing "/"
        if (!request.charAt(request.length-1) === "/") {
            request = request.substr(0, length-1);
        }

        src += request;

        return src;
    }

    var destinationCleanup = function (src) {

        return src.replace("https://github.com/", "").replace("/blob", "").replace(/\//g, "-");

    }

    var writeData = function(filename, data, encodeTo) {

        // Convert the requested response into a usable object then create a
        // buffer to switch the content from one encoding type to another (encode)
        var buffer = new Buffer(data, 'base64').toString(encodeTo);

        // Write the properly encode file to disk
        grunt.file.write(filename, buffer);

    }

    var writeJSONFile = function(filename, data, formate) {

        fs.writeFile(filename, JSON.stringify(data, null, 4), function(err) {
            if(err) {
              console.log(err);
            } else {
              grunt.log.writeln("API plugin cache updated!");
            }
        });

    }

};

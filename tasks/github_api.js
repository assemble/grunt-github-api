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

                var parameters = false;

                // Check for additional filters and oAuth
                if (taskOptions.oAuth || taskOptions.filters) {

                    parameters = parameterBuilder(taskOptions.oAuth, taskOptions.filters);

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

            if (requestQueue.length !== 0) {

                var collection = [];

                (function connect(requestQueue, collection) {

                    // Get the next request of the queue
                    var request = requestQueue.shift(),
                        taskSettings = request[2].options.task;

                    //console.log(request[2].options.task.type);

                    request[1].path = request[0];

                    var req = https.request(request[1], function(res) {

                        var data = "";
                        res.setEncoding('utf8');

                        res.on('data', function (chunk) {
                            data += chunk;
                        });

                        res.on('end', function() {

                            collection.push([data, request]);

                            // If there is nothing else to do go and prep the data that needs to be written
                            if (requestQueue.length === 0) {

                                if (collection.length > 0) {

                                    prepDataWrite(github_api, collection, taskSettings.type, function(){

                                        // Noting was left move to the next step.
                                        next(github_api);

                                    });

                                } else {

                                    // Noting was left move to the next step.
                                    next(github_api);
                                }

                            // Check to see if the data is suppose to be seperated.
                            } else if (requestQueue.length > 0 && taskSettings.concat === false) {

                                prepDataWrite(github_api, collection, taskSettings.type, function() {

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
                        grunt.log.writeln(e);
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

                writeJSONFile(cacheData.location, cacheData.contents, function(){

                    // Move to the next step
                    next(github_api);
                });

            } else {

                // There is nothing to see here, move along!
                 next(github_api);
            }

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

    var prepDataWrite = function(github_api, collection, requestType, cb) {

        //console.log(requestOptions);

        // first determine if we are handling data or a file.
        if (requestType === "data") {

            // Create a temp object which will contain all of the contents of the data objects that are returned
            var newFile = {},
                dest = false,
                data = false,
                request = false;

            // Check the number of items in the collection. If more than one exist, the contents will be
            if (collection.length == 1) {

                // Seperate the data and the request data object.
                data = collection[0][0];
                request = collection[0][1];

                // Check to see if a destination name was defined and the source is a string If so we can use the defined name
                if (request[2].data.dest && grunt.util.kindOf(request[2].data.src) == "string") {

                    // We can safely assume this use this name
                    dest = request[2].data.dest;

                } else {

                    // Since we only know that the request did not have a defined single source path or dest name,
                    // we will use the request path to generate a filename. Without any parameters
                    dest = destinationCleanup(request[0].split("?")[0], request[2].options.cache.path);

                }

                // Parse the data
                data = JSON.parse(data);

                // Since we only have one data object lets write it out.
                writeJSONFile(dest, data, function(){
                    grunt.log.writeln("Requested data written to " + dest);
                });


            } else {

                // Lets loop through all of the items
                for (var i = 0, len = collection.length; i < len; i++) {

                }

            }


        } else {

            // We are not allowing the concatination of raw files so get the data out of collection.
            var data = collection[0][0],
                request = collection[0][1],
                file = JSON.parse(data),
                origFilename = file.name,
                unqiueId = file.sha,
                origSrc = file.html_url,
                dest = false,
                cacheName = false,
                writeFile = true;

            // We will allow direct 1-to-1 overwriting of file name. so if one source is defined and one destination is defined
            // we will override the output name to match the user defined.
            if (request[2].data.dest && grunt.util.kindOf(request[0]) == "string") {

                // Pull the destination from the request options
                dest = request[2].data.dest;

            } else {

                // For simplcity sake we are going to build the filename from metadate returned by the API
                dest = destinationCleanup(origSrc, request[2].options.cache.path);
            }

            // Get a cache name (simply remove the file extension)
            cacheName = (dest.split(".")[0]);

            // Check cache settings to determine if we care about keeping cache info on this task at all.
            if (request[2].options.task.cache) {

                var cacheData = github_api.cache.get(request[2].name, cacheName);

                if (cacheData) {

                    // Check to see if the id's are different. If they are we need to update the file
                    if (cacheData.unqiueId == unqiueId) {

                        grunt.log.writeln("The returned file request matches what is on disk");

                    } else {

                        grunt.log.writeln("The returned file request is differnt overwriting previous version");

                        // Updating the cache value
                        github_api.cache.set(request[2].name, cacheName, "file", unqiueId);

                        // Write the missing file
                        writeData(dest, file.content, 'utf8', function(){
                            console.log(dest + " was written to disk");
                        });

                    }

                } else {

                    // Set the data.
                    github_api.cache.set(request[2].name, cacheName, "file", unqiueId);

                    // Write the file for the first time.
                    writeData(dest, file.content, 'utf8', function(){
                        console.log(dest + " was written to disk");
                    });


                }

            } else {

                // Ignoring cache on this task. Simply write the data.
                writeData(dest, file.content, 'utf8', function(){
                    console.log(dest + " was written to disk");
                });


            }

        }


        cb();

    };

    var sourceCleanup = function (src, request) {

        // Check to see if the request type has a leading "/" and remove it
        if (src.charAt(0) === "/") {
            src = src.substring(1);
        }

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

    var destinationCleanup = function (src, savePath) {

        // Remove move known unneeded request substrings
        src = src.replace("https://github.com/", "").replace("/\/blob/g", "").replace(/\//g, "-");

        // Remove possible leading "-"
        if (src.charAt(0) === "-") {
            src = src.substring(1);
        }

        if (savePath.charAt(savePath.length-1) !== "/") {
            src = savePath + "/" + src;
        } else {
            src = savePath + src;
        }

        console.log(src);

        return src;

    }

    var writeData = function(filename, data, encodeTo, cb) {

        // Convert the requested response into a usable object then create a
        // buffer to switch the content from one encoding type to another (encode)
        var buffer = new Buffer(data, 'base64').toString(encodeTo);

        // Write the properly encode file to disk
        fs.writeFile(filename, buffer, function(err) {

            if(err) {

              grunt.log.writeln(err);
              cb();

            } else {

              grunt.log.writeln("API plugin cache updated!");

              // Execute callback
              cb();
            }
        });


    }

    var writeJSONFile = function(filename, data, cb) {

        fs.writeFile(filename, JSON.stringify(data, null, 4), function(err) {
            if(err) {
              grunt.log.writeln(err);
            } else {
              grunt.log.writeln("API plugin cache updated!");

              // Execute callback
              cb();
            }
        });

    }

};

'use strict';

// Extra node modules
var https = require('https');
var fs = require('fs');
var crypto = require('crypto');
var mkdirp = require('mkdirp');

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

                    if (grunt.util.kindOf(src) === "array" && taskDetails.data.dest ) {

                        if (src.length > 1) {

                            for (var i = 0, len = src.length; i < len; i++ ) {
                                requestQueue.push([src[i], taskOptions.connection, taskDetails]);
                            }

                        } else {

                             requestQueue.push([src[0], taskOptions.connection, taskDetails]);

                        }

                    } else {

                        if (taskDetails.options.task.type == "data") {
                            grunt.log.writeln("You need to define a destination name if you are contcating multiple data sets");
                        } else {
                            grunt.log.writeln("You can not combile files with this plugin just yet!");
                        }

                    }

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

                    request[1].path = request[0];

                    var req = https.request(request[1], function(res) {

                        var data = "";
                        res.setEncoding('utf8');

                        res.on('data', function (chunk) {
                            data += chunk;
                        });

                        res.on('end', function() {

                            collection.push([JSON.parse(data), request]);

                            // If there is nothing else to do go and prep the data that needs to be written
                            if (requestQueue.length === 0) {

                                if (collection.length > 0) {

                                    prepWrite(github_api, collection, taskSettings.type, function() {

                                        // Flush the collection as it was sent for writting
                                        collection = [];

                                        // Noting was left move to the next step.
                                        next(github_api);

                                    });

                                } else {

                                    // Noting was left move to the next step.
                                    next(github_api);
                                }

                            // Check to see if the data is suppose to be seperated.
                            } else if (requestQueue.length > 0 && !taskSettings.concat) {

                                prepWrite(github_api, collection, taskSettings.type, function() {

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

            //console.log("save cache");

            var cache = github_api.cache.dump();

            if (cache.changed) {

                writeFile(cache.location, cache.contents, "data", function() {
                    grunt.log.writeln( "Cache has been updated." );

                    next(github_api);
                });


            } else {

                next(github_api);
            }

        };

        // Process stepper and executer.
        //=============================================================================================================

        var process = github_api.init(this, grunt)
            .step(generateRequests) // Generate requests from each task
            .step(sendRequests) // Send all requests and save/write data as needed
            .step(saveCache) // Save cache data
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

    var prepWrite = function(github_api, collection, requestType, cb) {

        var data = false,
            request = false,
            filepath = false;

        // first determine if we are handling data or a file.
        if ((requestType === "data" && collection.length === 1) || requestType === "file") {

            data = collection[0][0];
            request = collection[0][1];
            filepath = generate.filepath(true, request, requestType);

        } else {

            data = generate.data(collection);
            request = collection[0][1];
            filepath = generate.filepath(false, request, requestType);

        }

        // Do a quick data verification. If a message was returned it most likly means we have no real data.
        if (verifyData(data)) {

            // Check if the cache should be consulted
            if (request[2].options.task.cache) {

                // Check the request type, if its file the unquie id is the sha
                // for data we have to
                var target = request[2].name,
                    cacheName = filepath,
                    uniqueId = "";

                // Generate/ Gather all of the peoper cache information
                if (requestType === "file") {

                    uniqueId = data.sha;

                } else {

                    // Turn the data into a string
                    var jStr = JSON.stringify(data);

                    // Now generate a sha out of it and convert it to a hex encoding
                    uniqueId = crypto.createHmac("sha", jStr);
                    uniqueId = uniqueId.digest('hex');

                }

                var cacheData = github_api.cache.get(request[2].name, filepath);

                if (cacheData) {

                    if (uniqueId == cacheData.uniqueId) {

                        // Dont have to do anything
                        grunt.log.writeln( filepath + " is already up-to-date. (No data has been written)");

                        cb();

                    } else {

                        // Update the cache
                        github_api.cache.set(request[2].name, filepath.split(".")[0], requestType, uniqueId);

                        writeFile(filepath, data, requestType, function() {
                            grunt.log.writeln( filepath + " was written to disk.");

                            cb();
                        });

                    }

                } else {

                    github_api.cache.set(request[2].name, filepath.split(".")[0], requestType, uniqueId);

                    // File needs to be written
                    writeFile(filepath, data, requestType, function() {
                        grunt.log.writeln( filepath + " was written to disk.");

                        cb();
                    });
                }


            } else {

                // Cache was mark to be ignroed so we will write the data reguardless.
                writeFile(filepath, data, requestType, function() {
                    grunt.log.writeln( filepath + " was written to disk.");

                    cb();
                });

            }

        } else {

            // Verification failed. Move along.
            cb();
        }

    };

    var verifyData = function(data) {


        if (grunt.util.kindOf(data) == "object") {

            // Check for the message property.
            var message = data.message || false;

            // Check to see if there there is a message property returnef.
            if (message) {

                grunt.log.writeln(message);

                return false;

            } else {

                return true;
            }

        } else {

            // Data is not a object, can not verify
            return true;

        }

    };

    var writeFile = function(filepath, data, requestType, cb) {

        function write() {

            if (requestType === "data") {

                var buffer = new Buffer(JSON.stringify(data, null, 4));

            } else {

                var buffer = new Buffer(data, 'base64').toString('utf8');

            }

            //fs.writeFile(filename, data, [options], callback)
            fs.writeFile(filepath, buffer, function(err) {

                if (err) {
                    console.log(err);
                }

                cb();

            });
        }

        // Figure out the directory path
        var dirPath = filepath.split("/");

        // Remove the last filename
        dirPath.pop();

        // Reconstruct the file path based on the split array.
        dirPath = dirPath.join("/");

        // Check to see if the path exists
        fs.exists(dirPath, function (exists) {
            if (!exists) {

                mkdirp(dirPath, function (err) {

                    if (err) {
                        grunt.log.writeln("Error: Creating data directory path - " + dirPath);
                    } else {

                        // Now the directory structure is in place write the file.
                        write();
                    }

                });

            } else {

                // The directories exists, write the file
                write();
            }

        });

    }

    // Generate functions
    var generate = {

        filepath: function(singleFile, request, type) {

            if (singleFile) {

                var dest = request[2].data.dest || false,
                    origSrc = request[2].data.src;

                // Check if dest was not defined. If not we are going to use the defautl
                if (!dest) {

                    // No source path was definded, check to see what the original sorce was
                    if (grunt.util.kindOf(origSrc) == "array") {

                        // Check to see if the length is really an array of one, if so use that source
                        if (origSrc.length > 1) {

                            dest = origSrc[0];
                            dest = (request[2].options.connection.path).split("?")[0]

                            //console.log(request[2].options.connection.path);
                            //console.log(dest);

                        } else {

                            // Source if from a larger array. so we will used the requested string instead.
                            dest = request[0];

                        }

                    } else {

                        // only other thing could have been a string so set the dest to the source request
                        dest = origSrc;

                    }

                }

            } else {

                // Multiple data sets return that will need to be concatinated into one.
                dest = request[2].data.dest

            }

            // Take any parameters off of the dest string if they exist
            dest = dest.split("?")[0];

            // Add output directory if it is defined
            if (request[2].options.output.path) {

                var outputPath = request[2].options.output.path;

                if(dest.charAt(0) === "/") {
                    dest = dest.substring(1);
                }

                if (outputPath.charAt(outputPath.length-1) === "/") {
                    dest = outputPath + dest;
                } else {
                    dest = outputPath + "/" + dest;
                }


            }

            return dest;
        },

        data: function(collection) {

            // Create a new object for the data to be put together
            var finishedObject = {}

            for (var i = 0, len = collection.length; i < len; i++ ) {

                // Add the current
                finishedObject[i] = collection[i][0];

            }

            return finishedObject;

        }

    }

};

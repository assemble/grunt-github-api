/*!
 * grunt-github-api
 * https://github.com/assemble/grunt-github-api
 * Authored by Jeffrey Herb <https://github.com/JeffHerb>
 *
 * Copyright (c) 2013 Jeffrey Herb, contributors
 * Licensed under the MIT license.
 */

'use strict';

// Include libraries
var https = require('https');
var fs = require('fs');
var crypto = require('crypto');
var mkdirp = require('mkdirp');

var github_api = function() {

    var steps = [];
    var requestQueue = [];
    var writeQueue = [];
    var cacheData = {
        location: "",
        contents: {},
        changed: false
    };

    var init = function(task, grunt) {

        // Pull the current task data and gurnt utilities
        this.task = task;
        this.grunt = grunt;

        // Set default project options
        var defaultOptions = {
            name: task.target,
            output: {
                path: "api-data",
                cache: ".cache.json",
                format: {
                    indent: 4,
                    encoding: 'utf8'
                }
            },
            connection: {
                host: 'api.github.com',
                headers: {
                    'User-Agent': 'node-http/0.10.1',
                    'Content-Type': 'application/json'
                },
            },
            rateLimit: {
                warning: 10,
            },
            type: "data",
            cache: true,
            concat: false,
            filters: false,
            oAuth: false,
        };

        // Set the options
        this.options = (mergeObject(defaultOptions, task.options({})));
        this.data = task.data;

        // Set the cache location from the options
        if (cacheData.location === "") {
            cacheData.location = this.options.output.path + "/" + this.options.output.cache;

            // Check to see if the cache directory path exists
            if (!grunt.file.isDir(this.options.output.path)) {
                grunt.file.mkdir(this.options.output.path);
            }

            if (grunt.file.exists(cacheData.location)) {

                cacheData.contents = grunt.file.readJSON(cacheData.location);

            }
        }

        // flush steps and request array
        steps = [];
        requestQueue = [];

        return this;

    };

    var step = function (fn) {

        // Add step to the steps array
        steps.push(fn);

        return this;

    };

    var execute = function(cb) {

        // Check to see if any steps have been implemented.
        if (steps.length === 0) {

            if (cb) {
                cb(null, true);
            }

            return true;

        }

        var step = 0, totalSteps = steps.length, self = this;

        // Step through all the defined steps.
        steps[step++](self, function next(github_api, terminate) {

            if (terminate) {

                if(cb) {

                    cb(null, true);

                } else {

                    return true;

                }

            } else {

                if (step < totalSteps) {

                    steps[step++](self, next);

                } else {

                    if(cb) {

                        cb(null, true);

                    } else {

                        return true;

                    }

                }

            }

        });

    };

    var request = {

        add: function (conObject, src, dest, options) {

            requestQueue.push([conObject, src, dest, options]);

        },

        send: function(cb) {

            (function nextRequest(requestQueue, collection, response) {

                var request = requestQueue.shift();

                // Add source to the connection header.
                request[0].path = request[1];


                var req = https.request(request[0], function(res) {

                    var data = "";
                    res.setEncoding('utf8');

                    res.on('data', function (chunk) {
                        data += chunk;
                    });

                    res.on('end', function() {

                        // Parse the data into an object so it can be manipulated
                        var reqData = JSON.parse(data);

                        //console.log(reqData);

                        // Check for an error response from the GitHub API.
                        if (reqData.message) {

                            console.log("GitHub returned an error: " + reqData.message);

                        } else {

                            collection.push(reqData);

                        }

                        if (requestQueue.length === 0) {

                            response.push([request[2], collection, request[3]]);

                            // We have finished getting all of the requests send back the response array
                            cb(response);

                        } else {

                            // Check to see if they multiple requests belong together
                            if (request[3].concat) {

                                //console.log("concat");

                                // Requests are together, call nest request
                                nextRequest(requestQueue, collection, response);

                            } else {

                                // These are individual request, so add current results to response buffer.
                                response.push([request[2], collection, request[3]]);

                                // Flush data array
                                collection = [];

                                // Call next request
                                nextRequest(requestQueue, collection, response);

                            }

                        }

                    });

                });

                req.on('error', function(e){
                    console.log(e);
                });

                req.end();

            })(requestQueue, [], []);

        }

    };

    var write = {

        add: function(data, dest, type, format) {

            writeQueue.push([data, dest, type, format]);

        },

        write: function(data, dest, type, format, cb) {

            //console.log(data.length);

            var buffer;

            console.log(format);

            if (type === "data") {
                buffer = new Buffer(JSON.stringify(data, null, format.indent));
            } else {
                buffer = new Buffer(data[0].content, 'base64').toString(format.encoding);
            }

            fs.writeFile(dest, buffer, function(err) {

                console.log(dest + " was written to disk.");

                if (err) {
                    console.log(err);
                }

                cb();

            });

        },

        save: function(cb) {

            if (writeQueue.length > 0) {

                (function nextFile(writeQueue, w) {

                    var wq = writeQueue.shift();

                    // Figure out the directory path
                    var dirPath = wq[1].split("/");

                    // Remove the last filename
                    dirPath.pop();

                    // Reconstruct the file path based on the split array.
                    dirPath = dirPath.join("/");

                    // Check to see if the path exists
                    fs.exists(dirPath, function (exists) {

                        if (!exists) {

                            mkdirp(dirPath, function (err) {

                                if (err) {
                                    console.log("Error: Creating data directory path - " + dirPath);
                                } else {

                                    // Now the directory structure is in place write the file.
                                    write.write(wq[0], wq[1], wq[2], wq[3], function(){

                                        if (writeQueue.length === 0) {

                                            cb();

                                        } else {

                                            nextFile(writeQueue, w);

                                        }

                                    });
                                }

                            });

                        } else {

                            // The directories exists, write the file
                            write.write(wq[0], wq[1], wq[2], wq[3], function(){

                                if (writeQueue.length === 0) {

                                    cb();

                                } else {

                                    nextFile(writeQueue, w);

                                }

                            });
                        }

                    });

                })(writeQueue, this);

            } else {

                cb();
            }

        }

    };

    var path = {

        cleaner: function(path, leadSlash, tailSlash) {

            // Check for a leading slash, then add or remove it as needed.
            if (path.charAt(0) === "/") {

                if (!leadSlash) {
                    path = path.substring(1);
                }

            } else {

                if (leadSlash) {
                    path = "/" + path;
                }

            }

            // Check for trailing slash, then add or remove it as needed.
            if (path.charAt(path.length - 1) === "/") {

                if (!tailSlash) {
                    path = path.substring(0, path.length - 1);
                }

            } else {

                if (tailSlash) {
                    path += "/";
                }

            }

            return path;

        },

        construct: function(array) {

            return array.join("/");

        },

        parameters: function() {

            var temp = [];

            for (var i=0; i<arguments.length; i++) {

                if (arguments[i]) {

                    for (var item in arguments[i]) {

                        temp.push(item + "=" + arguments[i][item]);

                    }

                }

            }

            return temp.join("&");

        },

    };

    var cache = {

        set: function(target, cacheName, type, uniqueId) {

            (function(cb) {

                // Build a copy of the object
                var specificItem = {
                    type: type,
                    uniqueId: uniqueId
                };

                if (cacheData['contents'][target]) {

                    // Check to see if the task is in the cache target contents
                    if (cacheData['contents'][target][cacheName]) {

                        cacheData['contents'][target][cacheName] = specificItem;

                    } else {

                        cacheData['contents'][target][cacheName] = {};
                        cacheData['contents'][target][cacheName] = specificItem;
                    }

                } else {

                    cacheData['contents'][target] = {};
                    cacheData['contents'][target][cacheName] = specificItem;
                }

                cb();

            })(function() {

                // Make the cacheData object as changed so it can be saved
                cacheData.changed = true;

            });

        },

        // Return the cache object based on the task a cache name provided
        get: function(target, cacheName) {

            if (cacheData.contents[target]) {

                if (cacheData.contents[target][cacheName]) {
                    return cacheData.contents[target][cacheName];
                } else {
                    return false;
                }

            } else {
                return false;
            }

        },

        dump: function() {

            return cacheData;

        },

        status: function() {

            return cacheData.changed;
        },

        saved: function() {
            cacheData.changed = false;
        },

        generateId: function(str) {

            str = crypto.createHmac("sha", str);

            return str.digest('hex');

        }

    };


    /**
     * Lib Helper functions
     * @param  {Object} obj1
     * @param  {Object} obj2
     * @return {Object}
     */
    var mergeObject = function(obj1, obj2) {

      for (var p in obj2) {

        try {
          // Property in destination object set; update its value.
          if ( obj2[p].constructor === Object ) {

            if (obj1[p].constructor !== Object) {
                obj1[p] = {};
            }
            obj1[p] = mergeObject(obj1[p], obj2[p]);

          } else {
            obj1[p] = obj2[p];
          }

        } catch(e) {

          // Property in destination object not set; create it and set its value.
          obj1[p] = obj2[p];

        }
      }

      return obj1;
    };

    // Return publically accessible items
    return {

        init: init,
        step: step,
        execute: execute,
        request: request,
        path: path,
        write: write,
        cache: cache

    };


};

module.exports = exports = new github_api();

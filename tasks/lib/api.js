'use strict';

var github_api = function() {

    var steps = [];
    var requests = [];
    var cacheData = {
        location: "",
        contents: {},
        changed: false,
    }

    var init = function (task, grunt) {

        this.task = task;
        this.grunt = grunt;

        // Pull in the task options and merge with defaults below.
        var defaultOptions = {
            cache: {
                path: "api-data",
                file: ".cache.json"
            },
            connection: {
                host: 'api.github.com',
                headers: {
                    'User-Agent': 'node-http/0.10.1',
                    'Content-Type': 'application/json'
                },
            },
            task: {
                action: "request",
                type: "data",
                concat: false,
                stepCb: false,
                finishCb: false,
                cache: true,
            },
            filters: false,
            oAuth: false
        };

        // Set the options
        this.options = (mergeObject(defaultOptions, task.options({})));

        // Set the cache location from the options
        cacheData.location = this.options.cache.path + "/" + this.options.cache.file;

        // Check to see if the cache directory path exists
        if (!grunt.file.isDir(this.options.cache.path)) {
            grunt.file.mkdir(this.options.cache.path);
        }

        if (grunt.file.exists(cacheData.location)) {

            cacheData.contents = grunt.file.readJSON(cacheData.location);

        }


        // Generate task details object. This will be the object a bulk of work with be used to produce
        this.taskDetails = {
            name: task.target,
            data: task.data,
            options: this.options
        };

        // flush steps and request array
        steps = [];

        return this;

    };

    var step = function (fn) {

        steps.push(fn);

        return this;

    }

    var execute = function (cb) {

        // Check to see if any steps have been implemented.
        if (steps.length === 0) {

            if (cb) {
                cb(null, true);
            }

            return true;

        }

        var step = 0, totalSteps = steps.length, self = this;

        // Step through all the defined steps.
        steps[step++](self, function next(github_api) {

            if (step < totalSteps) {

                steps[step++](self, next);

            } else {

                if(cb) {

                    cb(null, true);

                } else {
                    return true;
                }

            }

        });

    };

    // Special cache related functions
    var cache = {

        set: function(target, cacheName, type, unqiueId) {

            (function(cb) {

                // Build a copy of the object
                var specificItem = {
                    type: type,
                    unqiueId: unqiueId
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

            })(function(){

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

        getAll: function() {

            return cacheData;

        }
    }

    function mergeObject(obj1, obj2) {

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
    }

    // Return publically accessible items
    return {

        // setup functions
        init: init,
        step: step,
        execute: execute,

        // special functions
        cache: cache
    }

}

module.exports = exports = new github_api();

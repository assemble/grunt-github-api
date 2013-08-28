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
if (request[2].data.dest && (grunt.util.kindOf(request[0]) == "string" || (grunt.util.kindOf(request[0]) == "array" && request[0].lenght === 1) ) ) {

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
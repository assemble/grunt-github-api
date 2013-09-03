module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    github: {
      exampleIssues: {
        options: {
            oAuth: {
                access_token: "5a9a26428b86374627290de60eb912bd1f45a906"
            },
            filters: {
                state: "open"
            },
            task: {
                concat: true
            }
        },
        src: ['/repos/jeffherb/grunt-github-api-example/issues', '/repos/jeffherb/grunt-github-api/issues'],
        dest: "combinded-issues.json"
      },
      seperateIssues: {
        options: {
            oAuth: {
                access_token: "5a9a26428b86374627290de60eb912bd1f45a906"
            }
        },
        src: ['/repos/jeffherb/grunt-github-api-example/issues', '/repos/jeffherb/grunt-github-api/issues'],
      },
      examplePkg: {
        options: {
            oAuth: {
                access_token: "5a9a26428b86374627290de60eb912bd1f45a906"
            },
            task: {
                type: "file",
            }
        },
        src: '/repos/jeffherb/grunt-github-api-example/contents/example.json',
      },
    }

  });

  // Load the custom task
  grunt.loadTasks('tasks');

  // Default task(s).
  grunt.registerTask('default', ['github']);

};

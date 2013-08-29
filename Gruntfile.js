module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    github: {
      exampleIssues: {
        options: {
            oAuth: {
                access_token: ""
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
                access_token: ""
            }
        },
        src: ['/repos/jeffherb/grunt-github-api-example/issues', '/repos/jeffherb/grunt-github-api/issues'],
      },
      examplePkg: {
        options: {
            oAuth: {
                access_token: ""
            },
            task: {
                type: "file",
            }
        },
        src: '/repos/jeffherb/grunt-github-api-example/contents/package.json',
      },
    }

  });

  // Load the custom task
  grunt.loadTasks('tasks');

  // Default task(s).
  grunt.registerTask('default', ['github']);

};

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    github: {
      issue1: {
        options: {
            filters: {
                state: "open"
            },
        },
        src: ['/repos/jeffherb/grunt-github-api/issues', '/repos/jeffherb/buildsys/issues'],
        dest: "issues.json"
      },
      issue2: {
        src: '/repos/jeffherb/grunt-github-api/issues',
      },
      pkg: {
        options: {
            task: {
                type: "file",
            }
        },
        src: '/repos/jeffherb/grunt-github-api/contents/package.json',
      },
    }

  });

  // Load the custom task
  grunt.loadTasks('tasks');

  // Default task(s).
  grunt.registerTask('default', ['github']);

};

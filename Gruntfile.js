module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
        all: ['Gruntfile.js', 'tasks/github-api.js']
    }

  });

  // Load the custom task
  grunt.loadTasks('tasks');

  // Other NPM Modules
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task(s).
  grunt.registerTask('default', ['jshint']);

};

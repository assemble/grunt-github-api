module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    github: {
      options: {
        filters: {type: 'public'},
        reqType: "file"
      },
      pkg: {
        src: '/repos/assemble/assemble/contents/package.json',
        dest: 'pkg.json'
      }
    }

  });

  // Load the custom task
  grunt.loadTasks('tasks');

  // Default task(s).
  grunt.registerTask('default', ['github']);

};

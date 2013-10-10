/*!
 * grunt-github-api
 * https://github.com/assemble/grunt-github-api
 * Authored by Jeffrey Herb <https://github.com/JeffHerb>
 *
 * Copyright (c) 2013 Jeffrey Herb, contributors
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true
      },
      all: ['Gruntfile.js', 'tasks/**/*.js']
    },

    github: {
      exampleIssues: {
        options: {
          filters: {
            state: 'open'
          },
          concat: true
        },
        src: ['/repos/assemble/grunt-github-api-example/issues', '/repos/assemble/grunt-github-api/issues'],
        dest: 'combinded-issues.json'
      }
      /*
      seperateIssues: {
        src: ['/repos/assemble/grunt-github-api-example/issues', '/repos/assemble/grunt-github-api/issues'],
      },
      examplePkg: {
        options: {
          task: {
            type: 'file',
          }
        },
        src: '/repos/assemble/grunt-github-api-example/contents/example.json',
      }*/
    }

  });

  // Load tasks powered by npm plugins.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-readme');

  // Load this plugin's tasks.
  grunt.loadTasks('tasks');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'github', 'readme']);

};

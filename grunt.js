module.exports = function(grunt) {
  "use strict";
  // // Project configuration.
  grunt.initConfig({
    html2json: {
      dist: {
         src: ['trackable_table/templates/*.txt', 'trackable_table/templates/*.html'],
         dest: 'trackable_table/templates/tpl.json'
      }
    },

    shell: {
      copy: {
        command: 'cp -R trackable_table/ demos/demo1/js/apps/trackable_table'
      }
    },

    watch: {
      files: '<config:html2json.dist.src>',
      tasks: 'default'
    }
  });

  // Load local tasks.
  grunt.loadNpmTasks('grunt-html2json');
  grunt.loadNpmTasks('grunt-shell');

  // Default task.
  grunt.registerTask('default', 'html2json shell');

};

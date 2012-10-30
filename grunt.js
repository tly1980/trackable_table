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
      // copy: {
      //   command: 'cp -R trackable_table/ demos/demo1/js/apps/trackable_table'
      // },
      sass: {
          command: 'sass --update assets/css'
      },
      copy_js: {
          command: 'cp -R trackable_table/ demos/demo1/js/apps/trackable_table'
      },
      copy_css: {
          command: 'cp assets/css/*.css demos/demo1/css/trackable_table/.'
      }
    },

    watch: {
      sass: {
          files: ['assets/css/*.scss', 'assets/css/*.sass'],
          tasks: ['shell:sass']
      },

      watch_css: {
          files: ['assets/css/*.css'],
          tasks: ['shell:copy_css']
      },

      watch_tpl: {
          files: ['<config:html2json.dist.src>'],
          tasks: ['html2json', 'shell:copy_js']
      },

      watch_js: {
          files: ['trackable_table/*.js'],
          tasks: ['shell:copy_js']
      }
    }
  });

  // Load local tasks.
  grunt.loadNpmTasks('grunt-html2json');
  grunt.loadNpmTasks('grunt-shell');
  //grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', 'html2json shell');

};

// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config({
    baseUrl: 'js/vendor',
    paths: {
        jquery: 'jquery',
        underscore: 'underscore',
        backbone: 'backbone',
        text: 'text',
        apps:'../apps'
    },

    shim: {
        'backbone': ['jquery', 'underscore']
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs(['apps/trackable_table/widget'], function(widget){
    widget.init();
});

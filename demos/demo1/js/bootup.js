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
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs(['apps/helloworld/main'], function(hello_app){
    console.log('hello_app', hello_app);
    hello_app.init();
});

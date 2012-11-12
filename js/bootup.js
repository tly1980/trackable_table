// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.

requirejs.config({
    baseUrl: 'js/vendor',
    paths: {
        jquery: ['//cdnjs.cloudflare.com/ajax/libs/jquery/1.8.2/jquery.min', 'jquery-1.8.2.min'],
        underscore: 'underscore',
        backbone: 'backbone',
        bootstrap: [ 'bootstrap.min',
                    // don't know why, the cdnjs version is not placing the pop over properly
                    '//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.2.1/bootstrap.min'],
        text: 'text',
        apps:'../apps',
        mustache: 'mustache'
    },

    shim:{
        backbone: ['underscore', 'jquery'],
        jquery: {
            exports: "$"
        },
        bootstrap: {
            deps: ['jquery'],
            exports: "bootstrap"
        }
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs([
    'apps/trackable_table/widget',
    'apps/trackable_table/tutor'],
    function(widget, tutor){
    widget.init({
        name:         {text: 'Product Name',
                       changeable:true,
                       width: '55%'},

        unit_price:   {text: 'Unit Price', tpl: '${{val}}', width:'15%'},

        buying_price: {text: 'Buying Price',
                        tpl: '${{val}}',
                        changeable: true,
                        width:'15%',
                        rule:/^\d+[\.]{1}\d{2}$/,
                        tips: 'Please input number with two digits after decimal point. e.g. 23.58.'},

        sold_count:   {text: 'Sold Count',
                       changeable:true,
                       width:'15%',
                       rule:/^\d+$/,
                       tips: 'Please input integer only. e.g. 15.'}
    },
    
    'product_info' //url
    );

    $('div.dt_placeholder').append(
        widget.layout_view.$el);
    
    tutor.bind(widget.datatable, widget.changeset_view);

    widget.datatable.on('render_finished', function(){
        console.log('render done!');
    });

    widget.fetch();
});

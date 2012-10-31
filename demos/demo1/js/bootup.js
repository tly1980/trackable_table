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
        apps:'../apps',
        mustache: 'mustache'
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs(['apps/trackable_table/widget'], function(widget){
    widget.init();
    widget.url('/res/product_info');
    $('div.dt_placeholder').append(
        widget.datatable.$el.addClass('table'));

    widget.colums({
        name: 'Product Name',
        unit_price: 'Unit Price',
        buying_price: 'Buying Price',
        sold_count: 'Sold Count'
    });
    widget.fetch();
});

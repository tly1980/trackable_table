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
    widget.init({
        name:         {text: 'Product Name', changeable:true, width: '55%'},
        unit_price:   {text: 'Unit Price', tpl: '${{val}}', width:'15%'},
        buying_price: {text: 'Buying Price', tpl: '${{val}}', changeable: true, width:'15%'},
        sold_count:   {text: 'Sold Count', changeable:true, width:'15%'}
    }, '/res/product_info');

    $('div.dt_placeholder').append(
        widget.layout_view.$el);

    widget.fetch();
});

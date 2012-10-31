define(['jquery',
        'underscore',
        'backbone',
        'mustache',
        'text!./templates/tpl.json'],
    function ($, _, Backbone, mustache, tpl) {

    // var _headers = Backbone.Collection([
    //     { text: 'Header 1', key: 'header1'},
    //     { text: 'Header 2', key: 'header2'},
    //     { text: 'Header 3', key: 'header3'},
    //     { text: 'Header 4', key: 'header4'}
    // ]);

    var _headers = {
        header1: 'Header 1',
        header2: 'Header 2',
        header3: 'Header 3',
        header4: 'Header 4'
    };

    var _rows = new Backbone.Collection([
        {
            header1: 'value a',
            header2: 'value b',
            header3: 'value c',
            header4: 'value d'
        },

        {
            header1: 'value a',
            header2: 'value b',
            header3: 'value c',
            header4: 'value d'
        },

        {
            header1: 'value a',
            header2: 'value b',
            header3: 'value c',
            header4: 'value d'
        },

        {
            header1: 'value a',
            header2: 'value b',
            header3: 'value c',
            header4: 'value d'
        }
    ]);

    var DataTable = Backbone.View.extend({

        tagName: "div",
        className: "trackable_dt_table",

        events: {
            "dblclick td":   "dblclick_td"
        },

        dblclick_td: function(event){

        },

        initialize: function(){
            _rows.bind('reset',  this.render, this);
        },

        render: function() {
            var tbl_html = '<table>' + this.render_thead() + this.render_tbody() + '</tbody>';
            this.$el.html(tbl_html);
            return this;
        },

        render_thead: function(){
            var html = '<thead>';
            _.each(_headers, function(value, key){
                html += '<th>' + value +' </th>';
            });

            html += '</thead>';
            return html;
        },

        render_tbody: function(){
            rows = _rows.toJSON();
            var html = '<tbody>';  //tbody starts
            _.each( rows, function(r){
                html += '<tr>'; // tr starts
                _.each(_headers, function(value, key){
                    html += '<td>'; // td
                    //console.log('key:', key, ' value:', value);
                    //console.log('r', r);

                    html += r[key];
                    html += '</td>';
                });
                html += '</tr>';  // tr ends
            });
            html += '</tbody>'; // tbody
            return html;
        }

    });

    return {
        datatable: new DataTable(),

        init:function(){
            console.log('trackable_table widget init');
        },

        url: function(new_url){
           _rows.url = new_url;
        },

        colums: function(header){
            _headers = header;
        },

        fetch: function(){
            _rows.fetch();
        }

    };

});
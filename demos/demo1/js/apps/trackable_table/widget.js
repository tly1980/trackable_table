define(['jquery',
        'underscore',
        'backbone',
        'mustache',
        'text!./templates/tpl.json'],
    function ($, _, Backbone, Mustache, tpl) {

    var _headers = {
        header1: 'Header 1',
        header2: 'Header 2',
        header3: 'Header 3',
        header4: 'Header 4'
    };

    var _header_cfg ;



    var _changes = new Backbone.Collection([
    ]);

    function header_defaultcfg(headers){
        _.each(headers, function(value, key){
            headers[key] =  $.extend({
                text: 'Un-Titled',
                tpl: '{{val}}',
                changeable: false,
                extra_cls: []
            }, value);

            if (headers[key].changeable === true ){
                headers[key].extra_cls.push('changeable');
            }
        });
    }

    var InputView = Backbone.View.extend({

        events: {
            "keyup input": "input_keyup"
        },

        input_keyup: function(event){
            if (event.keyCode === 27 ){
                this.freeze_value(
                    this.model.get('origin_data'));
            }
            console.log('event', event);
        },

        recover: function(){
        },

        freeze_value: function(value){
            console.log('freeze_value, model', this.model.toJSON());
            var html = Mustache.render(
                this.model.get('tpl'),
                { val: this.model.get('origin_data') });
            this.$el.replaceWith(html);
        },

        render: function(){
            var html = '<input value="' + this.model.get('origin_data') + '"/>';
            this.$el.html(html);
            return this;
        }
    });

    function origin_val($elem){
        var cid = $elem.parent().attr('cid');
        return this.collection.getByCid(cid);
        //_rows[]
    }

    var DataTable = Backbone.View.extend({

        tagName: "div",
        className: "trackable_dt_table",

        events: {
            "dblclick td.changeable":   "dblclick_td"
        },

        dblclick_td: function(event){
            var $target_elem = $(event.currentTarget);
            var cid = $target_elem.parent().attr('cid');
            var field = $target_elem.attr('field');
            var row_model = this.collection.getByCid(cid);
            var tpl = _headers[field].tpl;
            
            var change = new Backbone.Model({
              origin_data: row_model.get(field),
              field: field,
              tpl: tpl
            });

            var input = new InputView({
                model: change
            });
            //$target_elem.empty();
            $target_elem.html(input.render().$el);
            input.$('input').focus();
            //console.log('change', change.toJSON());
        },

        initialize: function(){
            this.collection.bind('reset',  this.render, this);
        },

        render: function() {
            var tbl_html = '<table class="table">' + this.render_thead() + this.render_tbody() + '</tbody>';
            this.$el.html(tbl_html);
            return this;
        },

        render_thead: function(){
            var html = '<thead>';
            _.each(_headers, function(value, key){
                html += '<th>' + value.text +' </th>';
            });

            html += '</thead>';
            return html;
        },

        render_tbody: function(){
            var html = '<tbody>';  //tbody starts
            this.collection.each( function(r, i){
                html += '<tr cid="' + r.cid + '" >'; // tr starts
                _.each(_headers, function(value, key){

                    html += '<td field="' + key + '" class="' +
                            value.extra_cls.join(',') + '">'; // td
                    //console.log('key:', key, ' value:', value);
                    //console.log('r', r);

                    html += Mustache.render(
                        value.tpl,
                        {val: r.get(key)});

                    html += '</td>';
                });
                html += '</tr>';  // tr ends
            });
            html += '</tbody>'; // tbody
            return html;
        }

    });

    return {
        
        init:function(columns, new_url){
            this.rows = new (Backbone.Collection.extend({
                url: new_url
            }))();
            this.datatable = new DataTable({collection: this.rows});
            _headers = columns;
            header_defaultcfg(_headers);
            //this.rows.url = new_url;
            console.log('trackable_table widget init');
        },

        fetch: function(){
            this.rows.fetch();
        }

    };

});
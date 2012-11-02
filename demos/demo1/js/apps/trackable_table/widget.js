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

    var ret_obj = {
        changes: new Backbone.Collection([]),
        rows: new Backbone.Collection([])
    };



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
            "keyup input": "input_keyup",
            "blur input": "input_blur"
        },

        input_blur: function(event){
            return;
            var new_value = this.model.get('new_value');
            var origin_value = this.model.get('origin_value');
            var current_value = origin_value;
            if ( new_value !== undefined ){
                current_value = new_value;
            }
             this.freeze_value(current_value);
        },

        input_keyup: function(event){
            var input_value = this.$('input').val();
            var origin_value = this.model.get('origin_value');
            var new_value = this.model.get('new_value');
            var current_value = origin_value;
            if ( new_value !== undefined ){
                current_value = new_value;
            }

            console.log('keyCode', event.keyCode);

            //modifying a never changed cell
            if ( event.keyCode === 27 ){
                this.freeze_value(current_value);
            }

            if ( event.keyCode === 13 ) {
                if ( input_value === origin_value ){
                    console.log('aaa', this.$el.parent().attr('change_cid'));
                    //this.$el.parent().attr('change_cid');
                    this.$el.parent().removeAttr('change_cid');
                    ret_obj.changes.remove(this.model);
                }

                if ( current_value !== input_value && origin_value !== input_value ){
                    this.model.set('new_value', input_value);
                    if (ret_obj.changes.getByCid(this.model.cid) === undefined){
                        ret_obj.changes.push(this.model);
                        this.$el.parent().attr('change_cid', this.model.cid);
                    }
                }

                this.freeze_value(input_value);
            }
            //console.log('event', event, this.$el.parent());
        },

        recover: function(){
        },

        //freeze_value will remove the $el of this field
        freeze_value: function(value){
            console.log('freeze_value, model', this.model.toJSON());

            var html = Mustache.render(
                this.model.get('tpl'),
                { val: value });
            this.$el.parent().html(html);
        },

        render: function(){
            var html, new_value;
            input_value = this.model.get('origin_value');
            new_value = this.model.get('new_value');
            console.log('new_value', new_value);
            if ( new_value !== undefined ){
                input_value = new_value;
            }
            html = '<input value="' + input_value + '"/>';
            this.$el.html(html);
            return this;
        }
    });


    var ChangeSetView = Backbone.View.extend({
        collection: ret_obj.changes
    });

    var DataTable = Backbone.View.extend({

        tagName: "div",
        className: "trackable_dt_table",

        events: {
            "dblclick td.changeable":   "dblclick_td"
        },

        dblclick_td: function(event){
            var $target_elem = $(event.currentTarget);
            var cid = $target_elem.parent().attr('cid');
            var change_cid = $target_elem.attr('change_cid');
            var field = $target_elem.attr('field');
            var row_model = this.collection.getByCid(cid);
            var tpl = _headers[field].tpl;
            var change;
            
            if ( change_cid === undefined ){
                change = new Backbone.Model({
                  origin_value: row_model.get(field),
                  field: field,
                  tpl: tpl
                });
            } else {
                change = ret_obj.changes.getByCid(change_cid);
            }

            var input = new InputView({
                model: change
            });
            //$target_elem.empty();
            var width = $target_elem.width() - 10;
            $target_elem.html(input.render().$el.width(width));
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

    ret_obj.init = function(columns, new_url, change_url){
        this.rows.url = new_url;
        this.changes.url = change_url;

        this.datatable = new DataTable({collection: this.rows});
        this.changeset_view = new ChangeSetView({
            collection: this.changes
        });
        _headers = columns;
        header_defaultcfg(_headers);
        //this.rows.url = new_url;
        //console.log('trackable_table widget init');
    };

    ret_obj.fetch = function(){
        this.rows.fetch();
    };

    return ret_obj;
});
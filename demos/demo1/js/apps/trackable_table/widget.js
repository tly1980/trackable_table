define(['jquery',
        'underscore',
        'backbone',
        'mustache',
        'text!./templates/tpl.json'],
    function ($, _, Backbone, Mustache, tpl) {

    var ret_obj = {
        columns: {
            header1: 'Header 1',
            header2: 'Header 2',
            header3: 'Header 3',
            header4: 'Header 4'
        },

        tpl: JSON.parse(tpl),

        changes: new Backbone.Collection([]),
        rows: new Backbone.Collection([]),

        init_columns: function(){
            var that = this;
            var width = Math.round( 100 / _.keys(that.columns).length ) + '%';
            _.each(that.columns, function(value, key){
                that.columns[key] =  $.extend({
                    text: 'Un-Titled',
                    tpl: '{{val}}',
                    changeable: false,
                    extra_cls: [],
                    width: width
                }, value);

                if (that.columns[key].changeable === true ){
                    that.columns[key].extra_cls.push('changeable');
                }
            });

            console.log('columns:', this.columns);
        }
    };

    var LayoutView = Backbone.View.extend({

        className: 'row layout_view',
        tagName: 'div',

        initialize: function(){
            ret_obj.changes.bind('add', this.adjust, this);
            ret_obj.changes.bind('remove', this.adjust, this);
        },

        render: function(){
            console.log('tpl', ret_obj.tpl);
            this.$el.html(ret_obj.tpl.layout_view);
            return this;
        },

        adjust: function(){
            if ( ret_obj.changes.length > 0 ){
                this.$('.datatable_placeholder').removeClass('span12');
                this.$('.datatable_placeholder').addClass('span9');
                this.$('.changetable_placeholder').show();
            }else{
                this.$('.changetable_placeholder').hide();
                this.$('.datatable_placeholder').removeClass('span9');
                this.$('.datatable_placeholder').addClass('span12');
            }
        }
    });

    var InputView = Backbone.View.extend({

        className: 'input_div',

        events: {
            "keyup input": "input_keyup",
            "blur input": "input_blur"
        },

        input_blur: function(event){
            return;
            //return; //uncomment this line if you dont want to be confused by blur.
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

            //console.log('keyCode', event.keyCode);

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
            //console.log('freeze_value, model', this.model.toJSON());

            var html = Mustache.render(
                this.model.get('tpl'),
                { val: value });
            this.$el.parent().html(html);
        },

        render: function(){
            var html, new_value;
            input_value = this.model.get('origin_value');
            new_value = this.model.get('new_value');
            //console.log('new_value', new_value);
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
            var tpl = ret_obj.columns[field].tpl;
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
            //var width = $target_elem.width() - 10;
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
            _.each(ret_obj.columns, function(value, key){
                html += Mustache.render('<th style="width:{{width}};">{{text}}</th>', value);
            });

            html += '</thead>';
            return html;
        },

        render_tbody: function(){
            var html = '<tbody>';  //tbody starts
            this.collection.each( function(r, i){
                html += '<tr cid="' + r.cid + '" >'; // tr starts
                _.each(ret_obj.columns, function(value, key){

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

        this.layout_view = new LayoutView();

        this.datatable = new DataTable({collection: this.rows});
        this.changeset_view = new ChangeSetView({
            collection: this.changes
        });
        this.columns = columns;
        this.init_columns();

        this.layout_view.render();
        this.layout_view.$('.datatable_placeholder').append(
            this.datatable.$el);
        this.layout_view.$('.changetable_placeholder').append(
            this.changes.$el);
    };

    ret_obj.fetch = function(){
        this.rows.fetch();
    };

    return ret_obj;
});
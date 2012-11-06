require.config({
    shim: {
        './libs/bootstrap':   ['underscore', 'jquery']
    }
});

define(['jquery',
        'underscore',
        'backbone',
        'mustache',
        'text!./templates/tpl.json',
        './libs/bootstrap'],
    function ($, _, Backbone, Mustache, tpl, bootstrap) {

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

        layoutview_model: new Backbone.Model({
            show_changeset: false
        }) ,

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

            //console.log('columns:', this.columns);
        }
    };

    var LayoutView = Backbone.View.extend({

        className: 'layout_view',
        tagName: 'div',

        initialize: function(){
            ret_obj.changes.on('add', this.adjust, this);
            ret_obj.changes.on('remove', this.adjust, this);
            ret_obj.layoutview_model.on('change:show_changeset', this.show_changeset, this);
        },

        render: function(){
            //console.log('tpl', ret_obj.tpl);
            this.$el.html(ret_obj.tpl.layout_view);
            return this;
        },

        show_changeset: function(the_model){
            var el_width = this.$el.width();
            var $chgset_pholder = this.$('.changeset_placeholder');
            var $dt_pholder = this.$('.datatable_placeholder');

            var new_width;

            if ( the_model.get('show_changeset') === true &&
                 ret_obj.changes.length > 0 ){
                new_width = el_width - $chgset_pholder.outerWidth(
                    ) - $chgset_pholder.css(
                    'marginLeft').replace("px", "") - $dt_pholder.css(
                    'marginRight').replace("px", "") - $dt_pholder.css('marginLeft').replace("px", "");

                //this.$('.changeset_placeholder').show();
                $dt_pholder.width(new_width);
            }

            if ( the_model.get('show_changeset') === false ){
                new_width = el_width - $dt_pholder.css('marginLeft').replace(
                    'px', '') -  $dt_pholder.css('marginRight').replace(
                    'px', '');
                //this.$('.changeset_placeholder').fadeOut('fast');
                $dt_pholder.width(new_width);
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
                    //console.log('aaa', this.$el.parent().attr('change_cid'));
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
   
    // uniq_str('cs') indicate the changes comes from changeset view
    // uniq_str('dt') indicate the changes comes from datatable view
    function uniq_str(src){
        return src + ',' + (new Date()).toISOString();
    }

    var ChangeSetView = Backbone.View.extend({
        className: 'changeset_view',

        events: {
            "click a.icon-remove-sign": "click_remove",
            "click a.icon-search": "click_search",
            "click a.icon-zoom-out": "click_zoomout",
            "click button.changeset_title": "toggle_view",
            "click a.icon-remove": "click_remove_all",
            "click button.confirm_delete": "do_remove"
        },

        toggle_view: function(event){
            var $target_elem = $(event.currentTarget);
            //console.log('toggle_view');
            if ($target_elem.hasClass('active')){
                ret_obj.layoutview_model.set("show_changeset", false);
            }else{
                ret_obj.layoutview_model.set("show_changeset", true);
            }
        },

        click_remove_all: function(event){
            this.$('button.confirm_delete').removeAttr('cid');
            //console.log('click_remove', $target_elem);
            this.$('.dlg_title').text('Confirmation');
            this.$('.dlg_msg').text('Do you want to undo the all changes ?');
            $(this.$('div.modal')[0]).modal();
        },

        click_remove: function(event){
            //console.log('adf');
            var $target_elem = $(event.currentTarget);
            var cid = $target_elem.parents('[cid]').attr('cid');
            this.$('button.confirm_delete').attr('cid', cid);
            //console.log('click_remove', $target_elem);
            this.$('.dlg_title').text('Confirmation');
            this.$('.dlg_msg').text('Do you want to undo the change ?');
            $(this.$('div.modal')[0]).modal();
        },

        do_remove: function(event){
            console.log('confirm_delete');
            var $target_elem = $(event.currentTarget);
            var cid = $target_elem.attr('cid');

            if ( cid !== undefined ){
                var the_change = this.collection.getByCid(cid);
                $target_elem.removeAttr(cid);
                this.collection.remove([the_change]);
            }else {
                while(this.collection.length){
                    this.collection.pop();
                }
            }
        },

        click_search: function(event){
            var $target_elem = $(event.currentTarget);
            var cid = $target_elem.parents('[cid]').attr('cid');
            var the_change = this.collection.getByCid(cid);

            //uniq_str('cs') indicate the changes comes from changeset view
            the_change.set('highlight', uniq_str('cs'));
        },

        click_zoomout: function(event){
            var $target_elem = $(event.currentTarget);
            var cid = $target_elem.parents('[cid]').attr('cid');
            var the_change = this.collection.getByCid(cid);

            the_change.set('highlight_dismiss', uniq_str('cs'));
        },

        initialize: function(){
            this.collection.on('add', this.add_one, this);
            this.collection.on('remove', this.remove, this);
            ret_obj.layoutview_model.on('change:show_changeset', this.show_changeset, this);
        },

        show_changeset: function(the_model){
            
            if (the_model.get('show_changeset') === true){
                this.adjust_height(true);
                this.$('div.changet_view_content').fadeIn('fast');
            }else{
                this.adjust_height(false);
                this.$('div.changet_view_content').fadeOut('fast');
            }
        },

        render_one: function(the_model){
            var new_value = Mustache.render(the_model.get('tpl'),
                {val: the_model.get('new_value')});
            var origin_value = Mustache.render(the_model.get('tpl'),
                {val: the_model.get('origin_value')});
            var field = the_model.get('field');

            var field_text = ret_obj.columns[field].text;

            var ret = Mustache.render(
                ret_obj.tpl.changeset_item, {
                    cid: the_model.cid,
                    new_value:new_value,
                    origin_value:origin_value,
                    field_text: field_text
                });
            return ret;
        },

        highlight: function(the_change){
            //console.log('ChangeSetView::highlight');
            var cid = the_change.cid;
            var $the_change_div = this.$(
                '[cid=' + the_change.cid+ '] .the_change');
            $the_change_div.addClass('highlight');
            console.log($the_change_div.children('a.icon-search'));
            $the_change_div.find('a.icon-search').hide();
            $the_change_div.find('a.icon-zoom-out').show();

            var top = $the_change_div.position().top -
                this.$('ul').position().top - 30;
            console.log('scrollTop: ', top);

            if ( /^cs/.test(the_change.get('highlight')) === false){
                this.$('ul').animate({scrollTop: top }, 300);
            }
            //console.log('scroll to 1000', $el );
        },

        highlight_dismiss: function(the_change){
            var cid = the_change.cid;
            var $the_change_div = this.$(
                '[cid=' + the_change.cid+ '] .the_change');

            //console.log('ChangeSetView::highlight_dismiss');
            $the_change_div.find('a.icon-search').show();
            $the_change_div.find('a.icon-zoom-out').hide();

            this.$(
                '[cid=' + the_change.cid+ '] .the_change').removeClass('highlight');
        },

        new_value_changed: function(the_change){
            var html = this.render_one(the_change);
            this.$(
                '[cid=' + the_change.cid+ ']').replaceWith(html);
        },

        update_changeset_number: function(){
            var changeset_number = ret_obj.changes.length;
            this.$('.changeset_title').text('Change Sets (' + changeset_number + ')');
        },

        add_one: function(the_change){
            var html = this.render_one(the_change);
            the_change.on('change:new_value', this.new_value_changed, this);
            the_change.on('change:highlight', this.highlight, this);
            the_change.on('change:highlight_dismiss', this.highlight_dismiss, this);
            this.$('.changeset_title').show();
            this.$('ul').append(html);
            this.update_changeset_number();
        },

        remove: function(the_change){
            //console.log('remove called', the_change.toJSON());
            the_change.off();
            this.$(
                '[cid=' + the_change.cid+ ']').remove();
            if ( this.collection.length <= 0 ){
                this.$('.changeset_title').hide();
                ret_obj.layoutview_model.set('show_changeset', false) ;
            }else{
                this.update_changeset_number();
            }

        },

        adjust_height: function(show){
            var ul_height = ret_obj.height - 40;
            if ( show ){
                this.$el.height(ret_obj.height);
                console.log('ul height', ul_height);
                this.$('ul').height(ul_height);
            }else{
                this.$el.height(0);
            }
        },

        render: function(){
            //console.log('tpl', ret_obj.tpl.changeset_view);
            this.$el.html(
                ret_obj.tpl.changeset_view);
            this.$el.append(
                ret_obj.tpl.confirm_dlg);
            this.adjust_height(false);
            return this;
        }
    });

    var DataTable = Backbone.View.extend({

        tagName: "div",
        className: "trackable_dt_table",

        events: {
            "dblclick td.changeable":   "dblclick_td",
            "click td.changeable[change_cid]":   "click_highlighted"
        },

        display_tips: function(){
            // var elem = this.$('.changeable')[0];
            // $(elem).attr('title', 'Double click me to edit the content');
            // $(elem).tooltip('show');
        },

        click_highlighted: function(event){
            //this.$('.highlight').removeClass('.highlight');
            // console.log('click_highlighted');
            var $target_elem = $(event.currentTarget);
            var cid = $target_elem.attr('change_cid');
            var the_change = ret_obj.changes.getByCid(cid);

            var new_date = uniq_str('dt');
            if (the_change !== undefined){
                if ($target_elem.hasClass('highlight')){
                    console.log('a highlight_dismiss');
                    the_change.set('highlight_dismiss', new_date);
                }else{
                    console.log('a highlight');
                    the_change.set('highlight', new_date);
                }
            }
        },

        recover_one: function(the_change){
            var cid = the_change.cid;
            var $targe_elem = this.$('[change_cid=' + cid + ']');
            var html = Mustache.render(
                the_change.get('tpl'),
                {val: the_change.get('origin_value')});
            $targe_elem.removeClass('highlight');
            $targe_elem.html(html).removeAttr('change_cid');
            the_change.off('change:highlight', this.highlight, this);
            the_change.off('change:highlight_dismiss', this.highlight_dismiss, this);
        },

        listen_change: function(the_change){
            the_change.on('change:highlight', this.highlight, this);
            the_change.on('change:highlight_dismiss', this.highlight_dismiss, this);
        },

        highlight: function(the_change){
            var cid = this.$('.highlight').attr('change_cid');
            var the_change_highlighted = ret_obj.changes.getByCid(cid);
            if (the_change_highlighted !== undefined){
                the_change_highlighted.set('highlight_dismiss', uniq_str('dt'));
            }
            this.$('.highlight').removeClass('highlight');
            var $highlight_elem = this.$('[change_cid=' + the_change.cid+']');
            $highlight_elem.addClass('highlight');
            var top = $highlight_elem.position().top - this.$('table').position().top - 50;
            //console.log('top', top, 'scrollTop', s_top, 'offset_top', offset_top);
            var hl = the_change.get('highlight');
            console.log('hl', hl);
            if ( /^dt/.test(hl) === false){
                this.$el.animate({scrollTop: top }, 300);
            }
            
        },

        highlight_dismiss: function(the_change){
            this.$('[change_cid=' + the_change.cid+']').removeClass('highlight');
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
            this.collection.on('reset',  this.render, this);
        },

        render: function() {
            var tbl_html = '<table class="table table-condensed table-hover">' + this.render_thead() + this.render_tbody() + '</tbody>';
            this.$el.html(tbl_html);
            this.$el.height(ret_obj.height);
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

    ret_obj.init = function(columns, new_url, change_url, height){
        if (height === undefined){
            height = 400;
        }
        this.height = height;
        this.rows.url = new_url;
        this.changes.url = change_url;

        this.layout_view = new LayoutView();

        this.datatable = new DataTable({
            collection: this.rows});
        this.changeset_view = new ChangeSetView({
            collection: this.changes
        });

        this.columns = columns;
        this.init_columns();

        this.layout_view.render();
        this.changeset_view.render();

        this.changes.on('add',
            this.datatable.listen_change, this.datatable);

        this.changes.on('remove',
            this.datatable.recover_one, this.datatable);

        this.layout_view.$('.datatable_placeholder').append(
            this.datatable.$el);
        this.layout_view.$('.changeset_placeholder').append(
            this.changeset_view.$el);
    };

    ret_obj.fetch = function(){
        this.rows.fetch({
            success: function(){
                ret_obj.datatable.display_tips();
            }
        });
    };

    return ret_obj;
});
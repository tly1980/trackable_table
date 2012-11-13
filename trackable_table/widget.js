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

        show_tips: true,

        tpl: JSON.parse(tpl),

        changes: new Backbone.Collection([]),
        rows: new Backbone.Collection([]),

        layoutview_model: new Backbone.Model({
            show_changeset: false
        }),

        dialog_model: new Backbone.Model({
            show: false,
            title: 'Confirmation',
            msg_list: ['This is the message you would like to see !', 'hahah'],
            msg_class: 'alert'
        }),

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

        className: 'input_div control-group',

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
            var rule_pass = this.model.rule_test(input_value);
            if ( new_value !== undefined ){
                current_value = new_value;
            }

            //modifying a never changed cell
            if ( event.keyCode === 27 ){
                // hitting ESC
                this.freeze_value(current_value);
            }

            if (rule_pass === true &&
                this.popover_showed === true){

                this.$el.popover('hide');
                this.$el.removeClass('error');
                this.popover_showed = false;
                
            }else if ( rule_pass === false &&
                this.popover_showed === false){

                this.$el.popover('show');
                this.$el.addClass('error');
                this.popover_showed = true;
            }

            if ( event.keyCode === 13 && rule_pass !== false) {
                //when hitting enter
                if ( input_value === origin_value ){
                    //console.log('aaa', this.$el.parent().attr('change_cid'));
                    //this.$el.parent().attr('change_cid');
                    ret_obj.changes.remove(this.model);
                }

                if ( current_value !== input_value && origin_value !== input_value ){
                    this.model.set('new_value', input_value);
                    if (ret_obj.changes.getByCid(this.model.cid) === undefined){
                        // mark the parent td with 'change_cid',
                        // and this has to be done before pushing to changes collection
                        this.$el.parent().attr('change_cid', this.model.cid);
                        ret_obj.changes.push(this.model);
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
                this.model.get_tpl(),
                { val: value });
            //destroy the popover when this view is being disposed
            this.$el.popover('destroy');
            this.$el.parent().html(html);
        },

        render: function(){
            var html, new_value, field_text, field;

            input_value = this.model.get('origin_value');
            new_value = this.model.get('new_value');
            field = this.model.get('field');
            //console.log('new_value', new_value);
            if ( new_value !== undefined ){
                input_value = new_value;
            }
            html = '<input type="text" value="' + input_value + '"/>';
            this.$el.html(html);
            field_text = ret_obj.columns[field].text;
            this.$('input').attr('placeholder', field_text);
            this.init_rule_verify_popover();
            return this;
        },

        init_rule_verify_popover: function(){
            var rule = this.model.get_rule();
            var tips = this.model.get_tips();
            if (rule !== undefined){
                this.$el.popover({
                    title: 'Invalid Input',
                    content: tips,
                    placement: 'top'
                });

            }
        },

        initialize: function(){
            this.popover_showed = false;
        }
    });
   
    // uniq_str('cs') indicate the changes comes from changeset view
    // uniq_str('dt') indicate the changes comes from datatable view
    function uniq_str(src){
        return src + ',' + (new Date()).toISOString();
    }

    function show_dialog(title, msg_list, callback){
        ret_obj.dialog_model.set('title', title);
        ret_obj.dialog_model.set('msg_list', msg_list);
        ret_obj.dialog_model.set('callback', callback);
        ret_obj.dialog_model.set('show', new Date());
    }

    var DialogView = Backbone.View.extend({
        className: 'modal hide fade',
        events: {
            "click a.btn.ok": "click_ok"
        },

        initialize: function(){
            this.model.on('change:show', this.show, this);
        },

        show: function(){
            this.render();
            this.$el.modal();
        },

        render: function(){
            var html = Mustache.render(
                ret_obj.tpl.confirm_dlg, this.model.toJSON() ) ;
            this.$el.html(html);
            this.$('a').removeAttr('href'); //remove the annoying # that make the pages jumping around.
        },

        click_ok: function(){
            console.log('click_ok');
            callback = this.model.get('callback');
            if ( callback !== undefined ){
                callback();
            }
            this.$el.modal('hide');
            //this.$('.modal').modal('hide');
        }
    });

    var ChangeSetView = Backbone.View.extend({
        className: 'changeset_view',

        events: {
            "click a.icon-remove-sign": "click_remove",
            "click a.icon-search": "click_search",
            "click a.icon-zoom-out": "click_zoomout",
            "click button.changeset_title": "toggle_view",
            "click a.icon-remove": "click_remove_all",
            "click a.icon-chevron-up": "click_move",
            "click a.icon-chevron-down": "click_move"
        },

        click_move: function(event){
            var $target_elem = $(event.currentTarget);
            var move_down = true;
            if ($target_elem.hasClass('icon-chevron-up')){
                move_down = false;
            }

            var cid_current = this.$('.highlight').parent().attr('cid');
            var to_be_hl ;
            if (this.collection.length <= 0 ){
                return;
            }

            if (cid_current !== undefined){
                var current = this.collection.getByCid(
                    cid_current);
                var idx = this.collection.indexOf(current);

                if (move_down === true){
                    idx++;
                }else{
                    idx--;
                }

                idx = idx <= 0 ? 0 : idx;
                idx = idx >= this.collection.length ? this.collection.length - 1 : idx;

                to_be_hl = this.collection.at(idx);

            }else{
                to_be_hl = this.collection.at(0);
            }

            //console.log('idx', idx, to_be_hl, move_down, $target_elem);

            if (cid_current === to_be_hl.cid ){
                return;
            }

            //this.highlight(to_be_hl);
            if (to_be_hl !== undefined ){
                to_be_hl.set('highlight', uniq_str('ncs'));
            }
        },

        toggle_view: function(event){
            var $target_elem = $(event.currentTarget);
            if ($target_elem.hasClass('active')){
                ret_obj.layoutview_model.set("show_changeset", false);
            }else{
                ret_obj.layoutview_model.set("show_changeset", true);
            }

            this.trigger('toggle_view');
        },

        click_remove_all: function(event){
            var that = this;
            this.$('button.confirm_delete').removeAttr('cid');
            show_dialog('Undo Changes',
                ['You are about to remove all the changes.',
                 'Do you want to proceed this operation？'], function(){
                        while(that.collection.length){
                            that.collection.pop();
                        }
                 });
        },

        click_remove: function(event){
            //console.log('adf');
            var $target_elem = $(event.currentTarget);
            var cid = $target_elem.parents('[cid]').attr('cid');
            var the_change = this.collection.getByCid(cid);
            var that = this;
            this.trigger('click_remove');

            show_dialog('Undo Changes',
                ['You are about to undo one change.',
                 'Do you want to proceed this operation？'], function(){
                    that.collection.remove(the_change);
                 });
        },

        click_search: function(event){
            var $target_elem = $(event.currentTarget);
            var cid = $target_elem.parents('[cid]').attr('cid');
            var the_change = this.collection.getByCid(cid);

            //uniq_str('cs') indicate the changes comes from changeset view
            the_change.set('highlight', uniq_str('cs'));
            this.trigger('click_search');
        },

        click_zoomout: function(event){
            var $target_elem = $(event.currentTarget);
            var cid = $target_elem.parents('[cid]').attr('cid');
            var the_change = this.collection.getByCid(cid);

            the_change.set('highlight_dismiss', uniq_str('cs'));
            this.trigger('click_zoomout');
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
            var new_value = the_model.get_new_value(true);
            var origin_value = the_model.get_origin_value(true);
            var field = the_model.get('field');

            var field_text = ret_obj.columns[field].text;

            var ret = Mustache.render(
                ret_obj.tpl.changeset_item, {
                    db_id: the_model.get('id'),
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
            //console.log($the_change_div.children('a.icon-search'));
            $the_change_div.find('a.icon-search').hide();
            $the_change_div.find('a.icon-zoom-out').show();

            var top = $the_change_div.position().top -
                this.$('ul').position().top - 30;
            //console.log('scrollTop: ', top);

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
            //this.$('.changeset_title').text('Change Sets');
            this.$('span.changeset_title').text(changeset_number);
            this.trigger('update_changeset_number');
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
                this.$('.changeset_title').
                    removeClass('active').hide();
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
            this.adjust_height(false);
            return this;
        }
    });

    var ChangeModel = Backbone.Model.extend({

        get_origin_value: function(formated){
            if (formated === true){
                return Mustache.render(
                    this.get_tpl(),
                    {val: this.get('origin_value')});
            }
            return this.get('origin_value');
        },

        get_new_value: function(formated){
            if (formated === true){
                return Mustache.render(
                    this.get_tpl(),
                    {val: this.get('new_value')});
            }
            return this.get('new_value');
        },

        get_tpl: function(){
            return ret_obj.columns[
                this.get('field')].tpl;
        },

        get_rule: function(){
            return ret_obj.columns[
                this.get('field')].rule;
        },

        get_tips: function(){
            return ret_obj.columns[
                this.get('field')].tips;
        },

        rule_test: function(value){
            var rule = this.get_rule();
            if ( rule === undefined ){
                return undefined;
            }

            if (rule instanceof RegExp === true){
                return rule.test(value);
            }

            if (rule instanceof Function === true){
                return rule(value);
            }
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
            var origin_value_formated = the_change.get_origin_value(true);
            $targe_elem.removeClass('highlight');
            $targe_elem.html(
                origin_value_formated).removeAttr('change_cid');
            the_change.off('change:highlight', this.highlight, this);
            the_change.off('change:highlight_dismiss', this.highlight_dismiss, this);

            $targe_elem.tooltip('destroy');
        },

        listen_change: function(the_change){
            var cid = the_change.cid;
            var $targe_elem = this.$('[change_cid=' + cid + ']');
            var origin_value = the_change.get_origin_value(
                true);
            $targe_elem.tooltip({
                title: 'Origin: ' + origin_value,
                trigger: 'hover',
                placement: 'top'
            });

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
            //console.log('hl', hl);
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
            var change;
            
            if ( change_cid === undefined ){
                change = new ChangeModel({
                  origin_value: row_model.get(field),
                  field: field
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
            this.trigger('td_dblclick');
        },

        initialize: function(){
            this.collection.on('reset',  this.render, this);
        },

        render: function() {
            var tbl_html = '<table class="table table-condensed">' + this.render_thead() + this.render_tbody() + '</tbody>';
            this.$el.html(tbl_html);
            this.$el.height(ret_obj.height);
            this.trigger('render_finished');
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
            var db_id;
            this.collection.each( function(r, i){
                db_id = r.get('id');
                html += '<tr db_id="' + db_id  +'" cid="' + r.cid + '" >'; // tr starts
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

        this.dialog_view = new DialogView({
            model: this.dialog_model
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
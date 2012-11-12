define(['jquery',
        'underscore',
        'backbone',
        'bootstrap'],
function ($, _, Backbone, bootstrap) {
    var ret_obj = {

        datatable_view_on_render: function(){
            this.tip1_played = true;
            var the_model = this.datatable_view.collection.at(3);
            this.$tip1_elem = this.datatable_view.$('[cid=' + the_model.cid+'] td:nth(0)');
            this.$tip1_elem.popover({
                title: 'Tips 1',
                content: 'Double click the the cell, and change the value.<br/>' +
                         "Hit 'Enter' to save it, or 'ESC' to cancel.",
                placement:'top'
            });

            this.$tip1_elem.popover('show');
            this.tip1_played = true;

            this.datatable_view.off(null,
                    this.datatable_view_on_render);
        },

        datatable_on_dblclick: function(){
            this.$tip1_elem.popover('hide');
            this.$tip1_elem.popover('destroy');

            //unbind the events, because it only display one time
            this.datatable_view.off(null,
                    this.datatable_on_dblclick);
        },

        update_changeset_number: function(){
            this.$tip2_elem = this.changeset_view.$('button.changeset_title');
            this.$tip2_elem.popover({
                title: 'Tips 2',
                content: 'Click this button to review change sets.',
                placement: 'bottom'
            });

            this.$tip2_elem.popover('show');
            this.changeset_view.off( null, this.update_changeset_number);
        },

        changeset_toggle_view: function(){
            this.changeset_view.off( null, this.changeset_toggle_view);

            this.$tip2_elem.popover('hide');
            this.$tip2_elem.popover('destroy');

            this.tips_for_the_change();
        },

        tips_for_the_change: function(){
            this.$tips3_elem = this.changeset_view.$('div.the_change:nth(0)');
            this.$tips3_elem.popover({
                title: 'Tips 3',
                content: '<ul><li>Click <a class="icon-search" /> can toggle the changeset. </li>' +
                         '<li>Click <a class="icon-remove-sign" /> can undo the changeset. </li>' +
                         '<li>Click on the changed cell can also highlight the item</li></ul>',
                placement: 'left'
            });

            this.$tips3_elem.popover('show');
        },

        tips_for_the_change_dismiss: function(){
            this.$tips3_elem.popover('hide');
            this.$tips3_elem.popover('destroy');

            this.changeset_view.off( null, this.tips_for_the_change_dismiss);
        },

        bind: function(datatable_view, changeset_view){
            this.datatable_view = datatable_view;
            this.changeset_view = changeset_view;
            datatable_view.on('render_finished', this.datatable_view_on_render, this);
            datatable_view.on('td_dblclick', this.datatable_on_dblclick, this);
            changeset_view.on('update_changeset_number', this.update_changeset_number, this);
            changeset_view.on('toggle_view', this.changeset_toggle_view, this);
            changeset_view.on('click_remove', this.tips_for_the_change_dismiss, this);
            changeset_view.on('click_search', this.tips_for_the_change_dismiss, this);
        }
    };

    return ret_obj;
});
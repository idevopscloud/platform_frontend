define(['api', 'common'], function (YM, common) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;
        this.api = new YM();
        this.api.API_LIST({
            caas: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/caas/caas'},
                destroy: {type: 'DELETE', dataType: 'JSON', timeout: 60, url: 'third/caas/caas'},
            }
        });
        this.api.loadHooks = {
            beforeSend: function(){
                common.loading.show(self.dom);
            },
            fail: function(msg,data,code){
                common.msgs.pop_up(msg, 'error');
            },
            ajaxFail : function(msg){
                common.msgs.pop_up(msg, 'error');
            },
            ajaxComplete: function(textStatus){
                common.loading.hide(self.dom);
            }
        }
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function (query) {
            var self = this;
            self.preLoad ();
            self.bindEvent();
        },
        preLoad: function () {
            var self = this;
            self.loadcaass();
        },
        bindEvent: function() {
            var self = this;
            $('.caas-list').delegate('.caas-setting', 'click', function(event){
                event.preventDefault();
                var caas_id = $(this).parents('tr').data('id');
                window.location.hash = '#!/caas/create?caas_id='+caas_id;
            });
            $('.caas-list').delegate('.caas-remove', 'click', function(event) {
                event.preventDefault();
                var caas_id = $(this).parents('tr').data('id');
                $('#modal-confirm').modal('show');
                $('#modal-confirm .modal-body').html('删除应用将不可恢复，请确认');
                $('#do-action').unbind('click').on('click', function(event) {
                    event.preventDefault();
                    var caasDestroyApi = self.api.API('caas', 'destroy');
                    caasDestroyApi.apiPath += '/'+caas_id;
                    var hooks = $.extend({},self.api.loadHooks);
                    hooks.success = function(msg,data) {
                        self.loadcaass();
                    }
                    caasDestroyApi.load(hooks);
                    $('#modal-confirm').modal('hide');
                });
            });
        },
        loadcaass: function () {
            var self = this;
            var caasListApi = self.api.API('caas', 'list');
            var hooks = $.extend({},self.api.loadHooks);
            hooks.success = function(msg, data) {
                var caas_list_body = $('.caas-list').empty();
                $.each(data, function(id, caas) {
                    var tr = $('<tr>').data('id', caas.id);
                    tr.caasend($('<td>').html(caas.name))
                    .caasend($('<td>').html(caas.master_user_name))
                    .caasend($('<td>').html(caas.created_at))
                    .caasend($('<td>').html(caas.updated_at))
                    .caasend($('<td>').html("<button class='btn caas-setting'>设置</button><button class='btn caas-remove'>删除</button>"));
                    caas_list_body.caasend(tr);
                });
            };
            caasListApi.load(hooks);
        },
        dispose : function () {

        }
    });
        return widget;
});
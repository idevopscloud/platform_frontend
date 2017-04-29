define(['api', 'common', 'semantic'], function(YM, common) {
    'use strict';

    var widget = function(p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;
        this.api = new YM();
        this.api.API_LIST({
            app: {
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/apps'
                },
                destroy: {
                    type: 'DELETE',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/apps'
                },
            }
        });
        this.api.loadHooks = {
            beforeSend: function() {
                common.loading.show($("table"));
            },
            fail: function(msg, data, code) {
                common.msgs.pop_up(msg, 'error');
            },
            ajaxFail: function(msg) {
                common.msgs.pop_up(msg, 'error');
            },
            ajaxComplete: function(textStatus) {
                common.loading.hide($("table"));
            }
        }
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function(query) {
            var self = this;
            self.preLoad();
            self.bindEvent();
        },
        preLoad: function() {
            var self = this;
            self.loadApps();

        },
        bindEvent: function() {
            var self = this;
            $('.app-list').delegate('.app-setting', 'click', function(event) {
                event.preventDefault();
                var app_id = $(this).parents('tr').data('id');
                window.location.hash = '#!/manage/app_settings?app_id=' + app_id;
            });
            $('.app-list').delegate('.app-remove', 'click', function(event) {
                event.preventDefault();
                var app_id = $(this).parents('tr').data('id');
                $('#modal-confirm').modal({closable: false}).modal('show');
                $('#modal-confirm .modal-body').html('删除应用将不可恢复，请确认');
                $('#do-action').unbind('click').on('click', function(event) {
                    event.preventDefault();
                    var appDestroyApi = self.api.API('app', 'destroy');
                    appDestroyApi.apiPath += '/' + app_id;
                    var hooks = $.extend({}, self.api.loadHooks);
                    hooks.success = function(msg, data) {
                        $('#modal-confirm').modal('hide');
                        self.loadApps();
                    }
                    appDestroyApi.load(hooks);
                });
                return false;
            });
        },
        loadApps: function() {
            var self = this;
            var appListApi = self.api.API('app', 'list', {
                action: 'manage'
            });
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                var app_list_body = $('.app-list').empty();
                $.each(data.apps, function(id, app) {
                    var tr = $('<tr>').data('id', app.id);
                    tr.append($('<td>').html(app.name))
                        .append($('<td>').html(app.master_user_name))
                        .append($('<td>').html(app.created_at))
                        .append($('<td>').html(app.updated_at))
                        .append($('<td>').html("<button class='btn btn-green btn-navy btn-fill-horz  app-setting'>设置</button>\
                                        <button class='btn btn-red btn-navy btn-fill-horz app-remove'>删除</button>"));
                    app_list_body.append(tr);
                });
            };
            appListApi.load(hooks);
        },
        dispose: function() {

        }
    });
    return widget;
});
define(['api', 'common', 'directives/apps'  ], function (YM, common, appsManage) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            deploy : {
                lists: {type: 'GET', dataType: 'JSON', timeout: 60, url:'third/app/app/deploys'},
            },
        });

        this.api.loadHooks = {
            beforeSend: function(){
                common.loading.show(self.dom);
            },
            fail: function(msg,data,code){
                try {
                    msg = JSON.parse(msg);
                } catch (e){

                }
                if (typeof msg == 'object') {
                    var msgs = '';
                    $.each(msg, function(field, error){
                        msgs += error+"\n";
                    });
                    msg = msgs;
                }
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
            self.prevLoad();
            this.bindEvent();
        },
        prevLoad: function() {
            var self = this;
            if (window.location.hash != '#!/app/list') {
                $('#app-head').show();
                $('#app-head .panel-default').show();
            }else 
                $('#app-head').hide();
            self.loadDeploys();
        },
        bindEvent: function () {
            var self = this;
            $(".env-name").unbind('select2:select').on('select2:select', function() {
                self.loadDeploys();
            });

        },
        loadDeploys: function() {
            var self = this;
            var app_id = window._global.app_id || '';
            var instance_id = $(".env-name").val();
            if (!app_id && !instance_id)
                return;
            var deployListsApi = self.api.API('deploy', 'lists', {app_id: app_id, instance_id: instance_id});
            var hook = $.extend({}, self.api.loadHooks);
            hook.success = function(msg, data) {
                var box = $('#deploy-box');
                box.empty();
                $.each(data, function(_, deploy) {
                    var coms = [];
                    var rowspan = '';
                    if (deploy.components.length !==1) {
                        rowspan = 'rowspan="'+deploy.components.length+'"';
                    }

                    var tr = "<tr data-id='"+deploy.id+"'>\
                                <td "+rowspan+">#"+deploy.id+"</td>";
                    $.each(deploy.components, function(j, component){
                        if (j!=0) 
                            tr += '<tr><td>'+ component.name +':'+ component.version +'</td></tr>';
                        else
                            tr += '<td>'+ component.name +':'+ component.version +'</td>\
                                <td '+rowspan+'>'+deploy.user_name+'</td>\
                                <td '+rowspan+'>'+deploy.created_at+'</td>\
                                <td '+rowspan+'>'+deploy.updated_at+'</td>\
                                <td '+rowspan+'><button class="disabled btn deploy-load">载入</button></td>\
                            </tr>';
                    });
                    box.append(tr);
                });
            };
            deployListsApi.load(hook);
        },
        dispose: function(){
            
        }
    });

    return widget;
});

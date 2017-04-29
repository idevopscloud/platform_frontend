define(['api', 'common'], function (YM, common) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            caasInstance : {
                lists: {type: 'GET', dataType: 'JSON', timeout: 60, url:'third/app/caas/instances'},
                destroy: {type: 'DELETE', dataType: 'JSON', timeout: 60, url:'third/app/caas/instances'}
            }
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
            var query = self.query || '';
            self.prevload();
            self.bindEvent (query);
        },
        prevload: function() {
            var self = this;
            self.loadCaaSStatus();
        },
        loadCaaSStatus: function() {
            var self = this;
            var box = $('#container-box').empty();
            var caas_id = window._global.caas_id || '';
            var instanceListApi = this.api.API('caasInstance', 'lists'/*, {caas_id:caas_id}*/);
            var hook = $.extend({}, self.api.loadHooks);
            hook.success = function(msg, data) {
                if (!data.items) {
                    return;
                }
                
                $.each(data.items, function(id, instance) {
                    var access_url;
                    if (instance.svc && instance.svc.public_addresses && instance.svc.public_addresses[0]) {
                        access_url = instance.svc.public_addresses[0]+":"+instance.svc.ports[0].port;
                    } else if (instance.svc && instance.svc.external_IPs){
                        access_url = instance.svc.external_IPs[0];
                    } else {
                        access_url = '';
                    }
                    var tr = $('<tr>').data('id', instance.name);
                    var mem = '-';
                    var cpu = '-';
                    if (instance.pods[0].mem_usage >= 0) {
                        mem = instance.pods[0].mem_usage + '/' + instance.pods[0].mem_limit +" MB";
                    }
                    if (instance.pods[0].cpu_percentage >= 0) {
                        cpu = instance.pods[0].cpu_percentage + '%';
                    }
                    tr.append($('<td>').html(instance.name))
                        .append($('<td>').html(instance.pods[0].age))
                            .append($('<td>').html(cpu))
                                .append($('<td>').html(mem))
                                    .append($('<td>').html(instance.pods[0].status))
                                        .append($('<td>').html(access_url))
                                            .append($('<td>').html("<button class='btn instance-destroy'>删除</button>"));
                    box.append(tr);
                });
            };
            instanceListApi.load(hook);
        },
        bindEvent: function (query) {
            var self = this;
            $('#container-box').delegate('.instance-destroy', 'click', function(event){
                $('#modal-confirm .modal-body').html('确定要删除实例？');
                $('#modal-confirm').modal('show');
                var caas_instance_id = $(this).parents('tr').data('id');
                $('#do-confirm').unbind('click').on('click',function(){
                    var instanceDestroyApi = self.api.API('caasInstance', 'destroy');
                    instanceDestroyApi.apiPath += '/'+caas_instance_id;
                    var hook = $.extend({}, self.api.loadHooks);
                    hook.success = function(msg, data) {
                        common.msgs.pop_up("删除完成！");
                        self.loadCaaSStatus();
                    };
                    instanceDestroyApi.load(hook);
                    $('#modal-confirm').modal('hide');
                });
            });
            $('.stack-refresh').on('click', function(event){
                event.preventDefault();
                self.loadCaaSStatus();
            });
            /*$('.instance-add').on('click', function(){
                window.location.hash = '#!/app/caas_images'
            });*/
        },

        dispose : function () {
        }
    });

    return widget;
});

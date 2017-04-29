define(['api', 'common', 'semantic'], function(YM, common, JsonHuman) {
    'use strict';

    var widget = function(p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            ng: {
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/ngs'
                },
                info: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/ngs'
                }
            }
        });

        this.api.loadHooks = {
            beforeSend: function() {
                common.loading.show('#cluster-service');
            },
            fail: function(msg, data, code) {
                try {
                    msg = JSON.parse(msg);
                } catch (e) {
                    console.log(e);
                }
                if (typeof msg == 'object') {
                    var msgs = '';
                    $.each(msg, function(field, error) {
                        msgs += error + "\n";
                    });
                    msg = msgs;
                }
                common.msgs.pop_up(msg, 'error');
            },
            ajaxFail: function(msg) {
                common.msgs.pop_up(msg, 'error');
            },
            ajaxComplete: function(textStatus) {
                common.loading.hide('#cluster-service');
            }
        }
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function(query) {
            var self = this;
            self.preLoad(query);
            self.bindEvent();
        },
        preLoad: function(query) {
            var self = this;
            self.loadNgs();
        },
        bindEvent: function() {
            var self = this;
            $('.tab-cluster').delegate('.item', 'click', function() {
                $(this).addClass('active').siblings().removeClass('active');
                $('.tab-monitor').addClass('active');
                $('.count').html("-");
                $('.app-count').html($(this).data('apps'));
                $('.container-count').html($(this).data('containers'));
                $('.item .label').remove();
                self.loadNgMonitor($(this).data('id'));
            });
        },
        loadNgs: function() {
            var self = this,
                hooks = $.extend({}, self.api.loadHooks),
                loadAppsApi = self.api.API('ng', 'list', {action: 'team'});
            hooks.success = function(msg, data) {
                $('.tab-cluster').empty();
                $.each(data, function(id, ng) {
                    var containers = '0',
                        apps = '0';
                    if (ng.containers)
                        containers = ng.containers;
                    if (ng.apps)
                        apps = ng.apps.length;
                    var item = $("<div class='item'>").html(ng.name).data({'id': ng.id, 'apps': apps, 'containers': containers});
                    $('.tab-cluster').append(item);
                });
                $('.tab-cluster .item').first().trigger('click');
            };
            loadAppsApi.load(hooks);
        },
        loadNgMonitor: function(id) {
            var self = this,
                hooks = $.extend({}, self.api.loadHooks),
                loadClusterApi = self.api.API('ng', 'info', {
                    action: 'monitor'
                });
            loadClusterApi.apiPath += '/' + id;
            hooks.success = function(msg, data) {
                $('#basic-monitor-box').empty();
                if (data && data.length > 0) {
                    $('.node-count').html(data.length);
                    self.renderNodeBasic(data);
                }
                $('[data-toggle="tooltip"]').tooltip({
                    trigger: 'click hover',
                    placement: 'top',
                    html: true
                });
            };
            hooks.beforeSend = function() {
                common.loading.show('.statistics');
                common.loading.show('#basic-monitor-box');
            }
            hooks.ajaxComplete = function() {
                common.loading.hide('.statistics');
                common.loading.hide('#basic-monitor-box');
            }
            loadClusterApi.load(hooks);
        },
        renderNodeBasic: function(items) {
            var self = this,
                box = $('#basic-monitor-box'),
                ng_mem_used = 0,
                ng_mem_total = 0;
            $.each(items, function(_, item) {
                var tr = $("<tr>"),
                    td,
                    span = $('<span class="ui horizontal label">');
                item.ready == true && span.addClass('green').html("Y") || span.addClass('red').html('N');
                tr.append($('<td class="positive">') .append( item.name))
                    .append($('<td class="positive">').html(item.cpu.usage + '%'));

                td = $('<td class="positive">').html(item.cpu.load.load1 + ',  ' + item.cpu.load.load5 + ',  ' + item.cpu.load.load15);
                if (item.cpu.load.load1 >= (item.cpu.cores * 0.7)) {
                    td.removeClass('positive').addClass('negative').append('<i class="icon attention red" data-toggle="tooltip" title="CPU负载过高"></i>');
                }
                tr.append(td)
                    .append(
                        $('<td class="positive">').append($("<strong>").html('[' + (item.mem.used_mb / item.mem.total_mb * 100).toFixed(2) + '%] '))
                            .append(item.mem.used_mb.toFixed(0) + '/' + item.mem.total_mb.toFixed(0) + 'MB')
                );

                ng_mem_used += item.mem.used_mb / 1024;
                ng_mem_total += item.mem.total_mb / 1024;

                if (item.disk) {
                    var used = 0,
                        total = 0;
                    $.each(item.disk, function(_, disk) {
                        used += disk.used_mb;
                        total += disk.total_mb;
                    });
                    tr.append($('<td class="positive">').html((used/1024).toFixed(0) + '/' + (total/1024).toFixed(0) + 'G'))
                } else {
                    tr.append($('<td class="positive">'));
                }
                box.append(tr);
            });
            $('.mem-count').html(ng_mem_used.toFixed(0) + 'G/' + ng_mem_total.toFixed(0) + 'G');
        },
        dispose: function() {

        }

    });

    return widget;
});
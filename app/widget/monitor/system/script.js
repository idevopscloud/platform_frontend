define(['api', 'common', 'semantic'], function(YM, common, JsonHuman) {
    'use strict';

    var widget = function(p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            env: {
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/envs'
                },
                info: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/envs'
                },
                platform: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/env/platform'
                }
            },
            ng: {
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/ngs'
                }
            }
        });

        this.api.loadHooks = {
            beforeSend: function() {
                common.loading.show(self.dom);
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
                common.loading.hide(self.dom);
            }
        }
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function(query) {
            var self = this;
            self.bindEvent();
            self.preLoad(query);
        },
        preLoad: function(query) {
            var self = this;
            self.loadSystem();
            self.loadClusters();
        },
        bindEvent: function() {
            var self = this;
            $(".menu .item").on('click', function() {
                $(this).addClass('active').siblings().removeClass('active');
                $('#' + $(this).attr('for')).addClass('active').siblings().removeClass('active');
                if ($(this).attr('for') == 'cluster-service') { // first menu
                    self.loadClusters();
                }
            });
            $('.tab-cluster').delegate('.item', 'click', function() {
                $(this).addClass('active').siblings().removeClass('active');
                $('.tab-monitor').addClass('active');
                $('.count').html("0");
                $('.ng-count').html($(this).data('ngs'));
                $('.container-count').html($(this).data('containers'));
                $('.item .label').remove();
                self.loadClusterMonitor($(this).data('id'));
            });
        },
        loadSystem: function() {
            var self = this,
                hooks = $.extend({}, self.api.loadHooks),
                loadSystemApi = self.api.API('env', 'platform'),
                faild_count = 0,
                tr = $("<tr class='center aligned'>");
            hooks.success = function(msg, data) {
                if (data.service) {
                    var box = $('#system-service-box').empty();
                    $.each(data.service, function(name, service) {
                        var ready = true,
                            error = '',
                            td = $("<td class='positive'>").html(name);

                        if (service.http && typeof service.http === 'object') {
                            $.each(service.http, function(_svc, _ready) {
                                ready = ready && _ready;
                                if (!_ready) {
                                    error += 'HTTP检测失败：' + _svc + '<br>';
                                }
                            });
                        }
                        if (service.telnet && typeof service.telnet === 'object') {
                            $.each(service.telnet, function(_svc, _ready) {
                                if (typeof _ready === 'boolean') {
                                    ready = ready && _ready;
                                    if (!_ready) {
                                        error += 'TELNET检测失败：' + _svc + '<br>';
                                    }
                                }
                            });
                        }
                        if (typeof service.proc === 'boolean') {
                            ready = ready && service.proc;
                            if (!service.proc) {
                                error += '进程检测失败<br>';
                            }
                        }
                        if (!ready) {
                            faild_count++;
                            td.removeClass('positive')
                                .addClass('negative')
                                .append($('<i class="attention icon" data-toggle="tooltip" title="' + error + '"></i>'));
                        }
                        tr.append(td);

                    });
                    box.append(tr);
                    $('[data-toggle="tooltip"]').tooltip({
                        trigger: 'click hover',
                        placement: 'top',
                        html: true
                    });
                    if (faild_count > 0) {
                        $('.item[for="node-service"]').append($('<div class="floating ui red label"></div>').html(faild_count));
                    }
                }
            };
            hooks.beforeSend = function() {
                common.loading.show('#system-service-box');
            }
            hooks.ajaxComplete = function() {
                common.loading.hide('#system-service-box');
            }
            loadSystemApi.load(hooks);
        },
        loadClusters: function() {
            var self = this,
                hooks = $.extend({}, self.api.loadHooks),
                loadClustersApi = self.api.API('env', 'list');
            hooks.success = function(msg, data) {
                if (data.envs && data.envs.length > 0) {
                    $('.tab-cluster').empty();
                    $.each(data.envs, function(id, env) {
                        $('.tab-cluster').append($("<div class='item'>").html(env.name).attr('data-id', env.id));
                        self.loadNgs(env.name, env.id);
                    });
                    $('.tab-cluster .item').first().trigger('click');
                }
            };
            hooks.beforeSend = function() {
                common.loading.show('#cluster-service');
            };
            hooks.ajaxComplete = function() {
                common.loading.hide('#cluster-service');
            };
            loadClustersApi.options.async = false;
            loadClustersApi.load(hooks);
        },
        loadNgs: function(cluster, item_id) {
            var self = this,
                hooks = $.extend({}, self.api.loadHooks),
                loadAppsApi = self.api.API('ng', 'list', {
                    cluster: cluster
                }),
                item = $('.item[data-id="' + item_id + '"]');
            hooks.success = function(msg, data) {
                if (data && data.length > 0) {
                    var containers = 0;
                    item.data({
                        ngs: data.length
                    });
                    $.each(data, function(id, ng) {
                        containers += ng.containers;
                    });
                    item.data({
                        containers: containers
                    })
                }
            };
            hooks.beforeSend = function() {}
            hooks.ajaxComplete = function() {}
            loadAppsApi.load(hooks);
        },
        loadClusterMonitor: function(id) {
            var self = this,
                hooks = $.extend({}, self.api.loadHooks),
                loadClusterApi = self.api.API('env', 'info', {
                    action: 'monitor'
                });
            loadClusterApi.apiPath += '/' + id;
            hooks.success = function(msg, data) {
                $('#basic-monitor-box').empty();
                if (data.masters && data.masters.items && data.masters.items.length > 0) {
                    self.renderNodeBasic(data.masters.items, 'Master');
                    self.renderMasterService(data.masters.items);
                }
                if (data.nodes && data.nodes.items && data.nodes.items.length > 0) {
                    $('.node-count').html(data.nodes.items.length);
                    self.renderNodeBasic(data.nodes.items, 'Node');
                    self.renderNodeService(data.nodes.items);
                }
                $('[data-toggle="tooltip"]').tooltip({
                    trigger: 'click hover',
                    placement: 'top',
                    html: true
                });
                if (!self.timer) {
                    self.timer = setInterval(function() {
                        $('.tab-cluster>.item.active').trigger('click');
                    }, 20000);
                }
            };
            hooks.beforeSend = function() {
                common.loading.show('.statistics');
                common.loading.show('#basic-monitor-box');
                common.loading.show('#master-service-box');
                common.loading.show('#node-service-box');
            }
            hooks.ajaxComplete = function() {
                common.loading.hide('.statistics');
                common.loading.hide('#basic-monitor-box');
                common.loading.hide('#master-service-box');
                common.loading.hide('#node-service-box');
            }
            loadClusterApi.load(hooks);
        },
        renderNodeBasic: function(items, type) {
            var self = this,
                box = $('#basic-monitor-box'),
                faild_count = 0,
                cluster_mem_used = 0,
                cluster_mem_total = 0;
            $.each(items, function(_, item) {
                var tr = $("<tr>"),
                    td,
                    span = $('<span class="ui horizontal label">');
                item.ready == true && span.addClass('green').html("Y") || span.addClass('red').html('N');
                tr.append($('<td class="positive">') /*.append(span)*/ .append('<span class="ui horizontal black label">' + type + '</span>' + item.name));
                tr.append($('<td class="positive">').html(item.cpu.usage + '%'));

                td = $('<td class="positive">').html(item.cpu.load.load1 + ',  ' + item.cpu.load.load5 + ',  ' + item.cpu.load.load15);
                if (item.cpu.load.load1 >= (item.cpu.cores * 0.7)) {
                    td.removeClass('positive').addClass('negative').append('<i class="icon attention red" data-toggle="tooltip" title="CPU负载过高"></i>');
                }
                tr.append(td)
                    .append(
                        $('<td class="positive">').append($("<strong>").html('[' + (item.mem.used_mb / item.mem.total_mb * 100).toFixed(2) + '%] '))
                        .append(item.mem.used_mb.toFixed(0) + '/' + item.mem.total_mb.toFixed(0) + 'MB')
                    );

                cluster_mem_used += item.mem.used_mb / 1024;
                cluster_mem_total += item.mem.total_mb / 1024;

                if (item.disk) {
                    var used = 0,
                        total = 0;
                    $.each(item.disk, function(_, disk) {
                        used += disk.used_mb;
                        total += disk.total_mb;
                    });
                    tr.append(
                        $('<td class="positive">').append($("<strong>").html('[' + (used / total * 100).toFixed(2) + '%] '))
                        .append((used / 1024).toFixed(0) + '/' + (total / 1024).toFixed(0) + 'G')
                    );
                } else {
                    tr.append($('<td class="positive">'));
                }
                box.append(tr);
            });
            $('.mem-count').html(cluster_mem_used.toFixed(0) + 'G/' + cluster_mem_total.toFixed(0) + 'G');
        },
        renderMasterService: function(items) {
            var self = this,
                box = $('#master-service-box').empty(),
                faild_count = 0;
            $.each(items, function(_, item) {
                if (item.service) {
                    var tr = $("<tr class='center aligned'>");
                    $.each(item.service, function(name, service) {
                        var ready = true,
                            error = '',
                            span = $('<span class="ui horizontal label green">Y</span>'),
                            td = $("<td class='positive'>").html(name);

                        if (service.http && typeof service.http === 'object') {
                            $.each(service.http, function(_svc, _ready) {
                                ready = ready && _ready;
                                if (!_ready) {
                                    error += 'HTTP检测失败：' + _svc + '<br>';
                                }
                            });
                        }
                        if (service.telnet && typeof service.telnet === 'object') {
                            $.each(service.telnet, function(_svc, _ready) {
                                if (typeof _ready === 'boolean') {
                                    ready = ready && _ready;
                                    if (!_ready) {
                                        error += 'TELNET检测失败：' + _svc + '<br>';
                                    }
                                }
                            });
                        }
                        if (typeof service.proc === 'boolean') {
                            ready = ready && service.proc;
                            if (!service.proc) {
                                error += '进程检测失败<br>';
                            }
                        }
                        if (!ready) {
                            faild_count++;
                            td.removeClass('positive')
                                .addClass('negative')
                                .append($('<i class="attention icon" data-toggle="tooltip" title="' + error + '"></i>'));
                        }
                        tr.append(td);
                    });
                    box.append(tr);
                }
            });
            if (faild_count > 0) {
                $('.item[for="master-service"]').append($('<div class="floating ui red label"></div>').html(faild_count));
            }
        },
        renderNodeService: function(items) {
            var self = this,
                box = $('#node-service-box').empty(),
                faild_count = 0;
            $.each(items, function(_, item) {
                if (item.service) {
                    var tr = $("<tr><td class='positive'>" + item.IP + "</td>"),
                        all_ready = false;
                    $.each(item.service, function(name, service) {
                        var ready = true,
                            error = '',
                            span = $(''),
                            td = $("<td class='positive'>").html(name);
                        if (service.http && typeof service.http === 'object') {
                            $.each(service.http, function(_svc, _ready) {
                                ready = ready && _ready;
                                if (!_ready) {
                                    error += 'HTTP检测失败：' + _svc + '<br>';
                                }
                            });
                        }
                        if (service.telnet && typeof service.telnet === 'object') {
                            $.each(service.telnet, function(_svc, _ready) {
                                if (typeof _ready === 'boolean') {
                                    ready = ready && _ready;
                                    if (!_ready) {
                                        error += 'TELNET检测失败：' + _svc + '<br>';
                                    }
                                }
                            });
                        }
                        if (typeof service.proc === 'boolean') {
                            ready = ready && service.proc;
                            if (!service.proc) {
                                error += '进程检测失败<br>';
                            }
                        }

                        if (!ready) {
                            faild_count++;
                            td.removeClass('positive')
                                .addClass('negative')
                                .append($('<i class="attention icon" data-toggle="tooltip" title="' + error + '"></i>'));
                        }
                        tr.append(td);
                        all_ready = all_ready && ready;
                    });
                    box.append(tr);
                }
            });
            if (faild_count > 0) {
                $('.item[for="node-service"]').append($('<div class="floating ui red label"></div>').html(faild_count));
            }
        },
        dispose: function() {

        }

    });

    return widget;
});
define(['api', 'common', 'select2', 'select2.lang.zh', 'jquery.validate', 'validate_localization/messages_zh', 'pages', 'semantic', 'multipicker'], function(YM, common) {
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
                create: {
                    type: 'POST',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/envs'
                }
            },
            registry: {
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/registry/registries'
                },
            },
            ng: {
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/ngs'
                },
                create: {
                    type: 'POST',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/ngs'
                },
                update: {
                    type: 'PUT',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/ngs'
                },
                destroy: {
                    type: 'DELETE',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/ngs'
                },
            },
            company: {
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/account/companies'
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

                }
                if (typeof msg == 'object') {
                    var msgs = '';
                    $.each(msg, function(field, error) {
                        if (field !== 'nodes') {
                            $(".do-previous").trigger('click');
                        }
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
            self.preLoad(query);
            self.bindEvent(query);
        },
        preLoad: function(query) {
            var self = this;
            var page = query.page || 1;
            self.loadClusters(page);
        },
        bindEvent: function(query) {
            var self = this,
                page = query.page || 1,
                ngs;

            $("input[name=public]").on('change', function() {
                if (this.checked) {
                    $('.registry-attr').fadeIn();
                } else {
                    $('.registry-attr').fadeOut();
                }
                return true;
            });
            /*新增集群*/
            $('.add-cluster').on('click', function() {
                $('#modal-new').modal('show');
                $('#modal-new #do-new').unbind('click').on('click', function() {
                    /*if (self.checkCluster() == false) {
                        common.msgs.pop_up('集群健康检查失败');
                        $("#health_check").trigger('focus')
                        return false;
                    }*/
                    var clusterCreateApi = self.api.API('env', 'create', $('#form-new').serialize()),
                        hooks = $.extend({}, self.api.loadHooks);
                    hooks.success = function(msg, data) {
                        $('#modal-new').modal('hide');
                        common.msgs.pop_up("集群创建成功!", 'success');
                        self.loadClusters();
                    };
                    hooks.beforeSend = function() {
                        common.loading.show($('#modal-new>.modal-dialog'));
                    };
                    hooks.ajaxComplete = function() {
                        common.loading.hide($('#modal-new>.modal-dialog'));
                    };
                    clusterCreateApi.load(hooks);
                    return false;
                });
            });
            
            /*集群信息*/
            $('#cluster-box').delegate('.cluster-info', 'click', function() {
                event.stopPropagation();
                event.preventDefault();
                var loadRegistryApi = self.api.API('registry', 'list'),
                    hooks = $.extend({}, self.api.loadHooks),
                    parent = $(this).parents('tr'),
                    tb_cluster = $('<table class="ui definition celled striped table"><thead><tr><th colspan="2">集群信息</th></tr></thead>'),
                    tb_registry = $('<table class="ui definition table">').html('<thead><tr><th colspan="2">Registry信息</th></tr></thead>'),
                    registry_id = parent.data('registry-id');
 
                tb_cluster.append(
                    $('<tr>').append($('<td>').html('paas_api_url'))
                    .append($('<td>').html(parent.data('paas_api_url')))
                ).append(
                    $('<tr>').append($('<td>').html('k8s_endpoint'))
                    .append($('<td>').html(parent.data('k8s_endpoint')))
                );
                $('#modal-info .content').empty().append(tb_cluster);
                $('#modal-info').modal('show');
                hooks.beforeSend = function() {
                    common.loading.show('#modal-info');
                }
                hooks.ajaxComplete = function() {
                    common.loading.hide('#modal-info');
                }
                hooks.success = function(msg, data) {
                    $.each(data, function(name, value) {
                        tb_registry.append($('<tr>').append($('<td>').html(name)).append($('<td>').html(value)));
                    });
                    $('#modal-info .content').append(tb_registry);
                }
                if (registry_id) {
                    loadRegistryApi.apiPath += '/' + registry_id;
                    loadRegistryApi.load(hooks);
                }
                return false;
            });

            /*新增环境*/
            $('.cluster-ngs').delegate('.new-ng', 'click', function() {
                var loadClusterApi = self.api.API('env', 'info'),
                    hooks = $.extend({}, self.api.loadHooks),
                    nodes = $('#nodes').empty();
                var id = $('.cluster-ngs').data('cluster-id'),
                    name = $('.cluster-ngs').data('cluster-name');
                $('input[name="nodes"]').val(null);
                loadClusterApi.apiPath += "/" + id;
                $('#modal-ng').modal('show');
                hooks.beforeSend = function() {
                    common.loading.show('#modal-ng');
                }
                hooks.ajaxComplete = function() {
                    common.loading.hide('#modal-ng');
                }
                hooks.success = function(msg, data) {
                    if (data.nodes && data.nodes.items && data.nodes.items.length > 0) {
                        $.each(data.nodes.items, function(_, node) {
                            if (node.IP) {
                                nodes.append($('<li>').html(node.IP).attr('data-value', node.IP));
                            }
                        });
                        nodes.multiPicker({
                            selector: "li",
                            valueSource: "data-value",
                            cssOptions: {
                                vertical: true
                            }
                        });
                    }
                    $('#do-new-ng').unbind('click').on('click', function() {
                        if ($('input[name="nodes"]').val() == '') {
                            common.msgs.pop_up("请先选择节点!");
                            return false;
                        }
                        var ngCreateApi = self.api.API('ng', 'create', $('#form-ng').serialize() + '&cluster=' + name),
                            hooks = $.extend({}, self.api.loadHooks);
                        hooks.success = function(msg, data) {
                            $('#modal-ng').modal('hide');
                            common.msgs.pop_up("环境创建成功!", 'success');
                            $('#cluster-box tr.positive').trigger('click');
                        };
                        hooks.beforeSend = function() {
                            common.loading.show($('#modal-ng>.modal-dialog'));
                        };
                        hooks.ajaxComplete = function() {
                            common.loading.hide($('#modal-ng>.modal-dialog'));
                        };
                        ngCreateApi.load(hooks);
                        return false;
                    });
                }
                loadClusterApi.load(hooks);
            });

            /*集群的环境*/
            $('#cluster-box').delegate('tr', 'click', function() {
                var hooks = $.extend({}, self.api.loadHooks),
                    name = $(this).data('name'),
                    loadNgsApi = self.api.API('ng', 'list', {
                        cluster: name,
                    });
                $(this).addClass('positive').siblings().removeClass('positive');
                $('.cluster-ngs').data({'cluster-id': $(this).data('id'), 'cluster-name': name}).show();
                hooks.beforeSend = function() {
                    common.loading.show('.cluster-ngs');
                }
                hooks.ajaxComplete = function() {
                    common.loading.hide('.cluster-ngs');
                }
                hooks.success = function(msg, data) {
                    $('.cluster-ngs tbody').empty();
                    if (data.length > 0) {
                        ngs = {};
                        $.each(data, function(_, ng) {
                            var nodes = [],
                                teams = [],
                                instances = {},
                                tr = $("<tr>");
                            ngs[ng.id] = ng;
                            if (ng.nodes && ng.nodes.length > 0) {
                                $.each(ng.nodes, function(_, node) {
                                    nodes.push('<div class="item">\
                                                    <i class="square icon"></i>\
                                                    <div class="content">\
                                                    '+node.ipaddress+'\
                                                    </div>\
                                                </div>');
                                });
                            }
                            if (ng.teams && ng.teams.length > 0) {
                                $.each(ng.teams, function(_, team) {
                                    teams.push('<a class="ui black label">' + team.team_name + '</a>');
                                });
                            } else {
                                tr.addClass('warning');
                            }
                            if (ng.instances && ng.instances.length > 0) {
                                $.each(ng.instances, function(_,instance) {
                                    if (instance.app && instance.app.company_id) {
                                        instances[instance.app.company_id] = instance.name;
                                    }
                                });
                            }
                            var disabled = '';
                            if (teams.length>0) disabled = 'disabled';
                            $('.cluster-ngs tbody').append(
                                tr.append( $('<td class="collapsing">')
                                    .append($('<div class="ui fitted slider checkbox">')
                                        .append($('<input name="ngs" type="checkbox">').val(ng.id).data({instances: instances}).text(ng.name))
                                        .append($('<label>'))))
                                  .append($('<td>').html(ng.name))
                                  .append($('<td>').html('<div class="ui list">' + nodes.join('') + '</div>'))
                                  .append($('<td>').html(teams))
                                  .append('<td><button class="btn btn-red btn-default btn-fill-horz ng-destroy" '+disabled+' data-ng="'+ng.id+'">删除</button>\
                                    <button class="btn btn-green btn-default btn-fill-horz ng-node-edit" data-ng="'+ng.id+'">编辑</button></td>')
                            );
                        });
                    }
                    self.loadCompanies(page);
                }
                loadNgsApi.load(hooks);
            });

            $('.cluster-ngs').delegate('.ng-destroy', 'click', function() {
                var ng = $(this).data('ng'),
                    instances = $(this).data('instances'),
                    hooks = $.extend({}, self.api.loadHooks),
                    ngApi = self.api.API('ng', 'destroy');
                // if (instances) {
                //     common.msgs.pop_up("该环境（"+name+"）绑定了实例（" + instances + "）无法解除绑定，请联系应用所有者删除实例", 'error');
                //     return;
                // }
                ngApi.apiPath += '/' + ng;
                hooks.success = function(msg, data) {
                    $('#cluster-box tr.positive').trigger('click');
                }
                ngApi.load(hooks);
            });

            $('.cluster-ngs').delegate('.ng-node-edit', 'click', function() {
                var ng_id = $(this).data('ng'),
                    ng = ngs[ng_id],
                    sel_ips = [],
                    loadClusterApi = self.api.API('env', 'info'),
                    hooks = $.extend({}, self.api.loadHooks),
                    nodes = $('#ng_nodes').empty(),
                    id = $('.cluster-ngs').data('cluster-id'),
                    name = $('.cluster-ngs').data('cluster-name');
                $("#form-ng-node").find('input[name="name"]').val(ng.name);
                if (ng.env_category == 'product') {
                    $("#form-ng-node").find('input[name="product"]').prop({disabled: true, checked: true});
                } else {
                    $("#form-ng-node").find('input[name="product"]').prop({disabled: true, checked: false});
                }

                
                loadClusterApi.apiPath += "/" + id;
                hooks.beforeSend = function() {}
                hooks.ajaxComplete = function() {}
                hooks.success = function(msg, data) {
                    if (data.nodes && data.nodes.items && data.nodes.items.length > 0) {
                        $.each(data.nodes.items, function(_, node) {
                            if (node.IP) {
                                var li = $('<li>').html(node.IP).attr('data-value', node.IP),
                                    active = '';
                                $.each(ng.nodes, function(_, _node){
                                    if (_node.ipaddress == node.IP) {
                                        sel_ips.push(node.IP);
                                        // active = 'active';
                                        return false;
                                    }
                                });
                                li.addClass(active);
                                nodes.append(li);
                            }
                        });
                        // $('input[name="nodes"]').val(sel_ips);
                        nodes.multiPicker({
                            selector: "li",
                            prePopulate: sel_ips,
                            valueSource: "data-value",
                            cssOptions: {
                                vertical: true
                            }
                        });
                    }
                    $('#do-edit-ng').unbind('click').on('click', function() {
                        if ($('input[name="nodes"]').val() == '') {
                            common.msgs.pop_up("请先选择节点!");
                            return false;
                        }
                        var ngUpdateApi = self.api.API('ng', 'update', $('#form-ng-node').serialize()),
                            hooks = $.extend({}, self.api.loadHooks);
                        ngUpdateApi.apiPath += '/' + ng_id;
                        hooks.success = function(msg, data) {
                            $('#modal-ng-node-edit').modal('hide');
                            common.msgs.pop_up("环境更新成功!", 'success');
                            $('#cluster-box tr.positive').trigger('click');
                        };
                        hooks.beforeSend = function() {
                            common.loading.show($('#modal-ng-node-edit'));
                        };
                        hooks.ajaxComplete = function() {
                            common.loading.hide($('#modal-ng-node-edit'));
                        };
                        ngUpdateApi.load(hooks);
                        return false;
                    });
                };
                loadClusterApi.load(hooks);
                $("#modal-ng-node-edit").modal('show');
            });

        },
        loadClusters: function() {
            var self = this,
                box = $('#cluster-box').empty(),
                hooks = $.extend({}, self.api.loadHooks),
                loadClusterApi = self.api.API('env', 'list');
            hooks.success = function(msg, data) {
                if (data.envs && data.envs.length > 0) {
                    $.each(data.envs, function(_, cluster) {
                        var tr = $("<tr>").data({
                                paas_api_url: cluster.paas_api_url,
                                k8s_endpoint: cluster.k8s_endpoint,
                                id: cluster.id,
                                name: cluster.location
                            })
                            .append($("<td>").html(cluster.name));
                        if (cluster.registry_name && cluster.registry_id) {
                            tr.data('registry-id', cluster.registry_id).append(
                                $("<td>").append(cluster.registry_name)
                            );
                        } else {
                            tr.append($("<td>").html('default'))
                        }
                        tr.append(
                                $("<td>").html(cluster.created_at))
                            .append($("<td>").html('<button class="btn btn-green btn-default btn-fill-horz cluster-info">详情</button>'));
                        box.append(tr);
                    });
                }
            };
            hooks.beforeSend = function() {
                common.loading.show('#cluster-box');
            }
            hooks.ajaxComplete = function() {
                common.loading.hide('#cluster-box');
            }
            loadClusterApi.load(hooks);
        },
        checkCluster: function() {
            var url = $("#health_check").val();
            if (url) {
                $.ajax({
                    url: url,
                    method: 'get',
                    async: false,
                    success: function(data) {
                        if (data != 'ok')
                            return false;
                        return true;
                    },
                });
            } else {
                return false;
            }
        },
        loadCompanies: function(page) {
            var self = this;
            var companyListApi = self.api.API('company', 'list', {page: page});
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                $('.dropdown .menu .item').remove();
                var sel_data = [];
                $.each(data.data, function(_, company) {
                    $('.dropdown .menu').append($("<div class='item'>").html(company.name).attr('data-value', company.id));
                });
                $('.dropdown').dropdown({
                    onChange: function(value, text, $choice) {
                        if ($choice && value) {
                            var parent = $choice.parents('.dropdown'),
                                html = '',
                                ngs = [],
                                ng_ids = [],
                                ng_ins = {},
                                action = '';
                            $( "input[name=ngs]:checked" ).each(function(_, item){
                                var name = $(item).text(),
                                    ins = $(item).data('instances');
                                ngs.push(name);
                                ng_ids.push($(item).val());
                                ng_ins[name] = ins;
                            });
                            if (parent.hasClass('grant')) {
                                html = '将环境('+ngs.join(',')+')使用权授予团队('+text+')？';
                                action = 'grant';
                            } else {
                                for (var name in ng_ins) {
                                    if (ng_ins[name][value]) {
                                        common.msgs.pop_up("环境（"+name+"）被实例（"+ng_ins[name][value]+"）使用，无法解绑，请联系应用所有者删除实例", 'error');
                                        return;
                                    }
                                }
                                html = '剥夺团队('+text+')对环境('+ngs.join(',')+')使用权？';
                                action = 'strip';
                            }
                            $('#do-grant').unbind('click').on('click', function(){
                                console.log('grant' + value + ng_ids);
                                var param = {team_id: value, team_name: text, group_ids: ng_ids, action: action},
                                    ngUpdateApi = self.api.API('ng', 'update', param),
                                    hooks = $.extend({}, self.api.loadHooks);
                                ngUpdateApi.apiPath += '/' + ng_ids.join(',');
                                hooks.success = function(msg, data) {
                                    $('#modal-privilege').modal('hide');
                                    common.msgs.pop_up('权限更新成功！', 'success');
                                    $('#cluster-box tr.positive').trigger('click');
                                };
                                hooks.beforeSend = function(){},
                                hooks.ajaxComplete = function(){};
                                ngUpdateApi.load(hooks);
                                return false;
                            });
                            $('#modal-privilege .action-content').html(html);
                            $('#modal-privilege').modal({
                                closable  : false,
                                onHide: function() {
                                    $('.dropdown').dropdown('restore defaults');
                                }
                            }).modal('show');
                        }
                    }
                });
            };
            hooks.beforeSend = function(){
            };
            hooks.ajaxComplete = function(){
            };
            companyListApi.load(hooks);
        },
        dispose: function() {

        }
    });
    return widget;
});
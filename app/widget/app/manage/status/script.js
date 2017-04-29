define(['api', 'common', 'directives/apps'], function(YM, common, AppManage) {
    'use strict';

    var widget = function(p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            appInstance: {
                detail: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/instances',
                    model: 'rest'
                },
                destroy: {
                    type: 'DELETE',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/instances',
                    model: 'rest'
                },
                clean: {
                    type: 'POST',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/instance/clean'
                },
                cancel: {
                    type: 'POST',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/instance/cancel'
                },
                podrestart: {
                    type: 'POST',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/instance/podrestart'
                },
                create: {
                    type: 'POST',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/instances',
                    model: 'rest'
                },
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
                        msgs += error + "\n";
                    });
                    msg = msgs;
                }
                common.msgs.pop_up(msg, 'error');
            },
            ajaxFail: function(msg) {
                console.log(msg);
            },
            ajaxComplete: function(textStatus) {
                common.loading.hide(self.dom);
            }
        }
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function(query) {
            var self = this;
            self.prevload();
            self.bindEvent(query);
        },
        prevload: function() {
            var self = this;
            if (window.location.hash != '#!/app/list') {
                $('#app-head').show();
                $('#app-head .panel-default').show();
            } else
                $('#app-head').hide();
            if (window._global.env_category == 'product') {
                $('.env-destroy').addClass('disabled');
                // $('.env-new').addClass('disabled');
            } else {
                $('.env-destroy').removeClass('disabled');
            }

            var instance = $(".env-name").val();
            if (instance)
                self.loadInstanceStatus(instance, true);
        },
        bindEvent: function(query) {
            var self = this,
                env_category = window._global.env_category;

            $(".env-name").unbind('select2:select').on('select2:select', function() {
                window._global.deploy_id = '';
                if ($(this).val())
                    self.loadInstanceStatus($(this).val(), true);
            }).select2({
                minimumResultsForSearch: -1,
                width: '100%'
            });

            $('#component-box').delegate('tr', 'mouseenter mouseleave',
                function(event) {
                    var component = $(this).data('component');
                    if (event.type === 'mouseenter') {
                        $("tr[data-component='" + component + "']").css("background-color", "#f5f5f5");
                    } else {
                        $("tr[data-component='" + component + "']").css("background-color", "");
                    }
                }
            );

            // 刷新状态
            $('.stack-refresh').on('click', function(event) {
                event.preventDefault();
                var instance_id = $(".env-name").val();
                if (instance_id)
                    self.loadInstanceStatus(instance_id, true);
            });

            // 创建新的实例
            $('.env-new').on('click', function(event) {
                event.preventDefault();
                var ngs = AppManage.getNodeGroups();
                if (ngs && ngs.length > 0) {
                    $('#node-group').empty();
                    $.each(ngs, function(_, ng){
                        $('#node-group').append($('<option>').val(ng.id).text(ng.name));
                    });
                    $('#node-group').select2({width: '100%',placeholder: "请选择环境"}).select2('val', $('#sel-node-group').val());
                }
                $('#env-modal-new').modal('show');
                $("#do-new").unbind('click').on('click', function(event) {
                    event.preventDefault();

                    var form = $("#modal-form-new"),
                        params = {},
                        validator = form.validate({
                            lang: 'zh',
                            rules: {
                                name: {
                                    required: true,
                                    regex: /^[a-z][a-z0-9-]*[a-z0-9]$/,
                                    rangelength: [5, 50],
                                }
                            },
                            messages: {
                                name: "允许小写英文字母、数子、-等。以字母或数字开头，且在5~50之间",
                            },
                            errorPlacement: function(error, element) {
                                $(element)
                                    .closest("form")
                                    .find("label[for='" + element.attr("id") + "']")
                                    .append(error);
                            },
                            errorElement: "span"
                        });
                    if (form.valid() == false) {
                        validator.focusInvalid();
                        return false;
                    }

                    $.each(form.serializeArray(), function(_, kv) {
                        params[kv.name] = kv.value;
                    });
                    params.app_id = window._global.app_id;
                    params.node_group = $('#sel-node-group').val();
                    var appCreateApi = self.api.API('appInstance', 'create', params);
                    var hook = $.extend({}, self.api.loadHooks);
                    hook.success = function(msg, data) {
                        common.msgs.pop_up('实例创建成功', 'success');
                        $('#env-modal-new').modal('hide');
                        AppManage.load($('#sel-node-group').val());
                    };
                    hook.beforeSend = function() {
                        common.loading.show($("#env-modal-new>.modal-dialog"));
                    };
                    hook.ajaxComplete = function() {
                        common.loading.hide($("#env-modal-new>.modal-dialog"));
                    };
                    appCreateApi.load(hook);
                });
            });

            // clean running enviroment
            $('.env-clean').unbind('click').on('click', function() {
                event.preventDefault();
                var instance_id = $(".env-name").val();
                if (!instance_id) {
                    common.msgs.pop_up('请先选择实例', 'error');
                    return false;
                }
                $('#modal-confirm .modal-body').html('<p>确定要停止实例（删除所有在运行容器）？</p>');
                if (env_category == 'product') {
                    $('#modal-confirm .modal-body').append('<div class="form-group">\
                            <div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">\
                                <textarea class="form-control" name="comment" rows=5 placeholder="请说明需要停止的原因"></textarea>\
                            </div>\
                        </div>');
                }

                $('#modal-confirm').modal('show');
                $('#do-confirm').unbind('click').on('click', function() {
                    var comment = $('textarea[name=comment]').val();
                    var instanceCleanApi = self.api.API('appInstance', 'clean', {
                        instance_id: instance_id,
                        comment: comment
                    });
                    var hook = $.extend({}, self.api.loadHooks);
                    hook.success = function(msg, data) {
                        $('#do-confirm').button('reset');
                        $('#modal-confirm').modal('hide');
                        if (env_category == 'product') {
                            common.msgs.pop_up("停止实例申请已发送，请等待审批！", 'success');
                        } else {
                            common.msgs.pop_up("停止实例成功！", 'success');
                        }
                        self.loadInstanceStatus(instance_id, true);
                    };
                    hook.beforeSend = function() {};
                    hook.ajaxComplete = function() {
                        $('#do-confirm').button('reset');
                    };
                    instanceCleanApi.load(hook);
                    $('#do-confirm').button('loading');
                });
            });

            // clone app instance
            $('.env-clone').unbind('click').on('click', function() {
                event.preventDefault();
                // $('#do-pro-clone').data('env-category', 'develop');
                $(".new-app-instance").val("");
                var clone_select = $('select[name=clone-app-instance]');
                clone_select.empty().select2('data', {
                    id: 0,
                    text: "请选择实例"
                });;
                if (AppManage.envs.length > 0) {
                    $.each(AppManage.envs, function(_, n) {
                        var option = $('<option>').val(n.id).html(n.name);
                        clone_select.append(option);
                    });
                    clone_select.select2('val', null);
                    clone_select.unbind('select2:select').on('select2:select', function() {
                        var value = $(this).val();
                        var old_name = $('option[value=' + value + ']').html() || "new";
                        $(".new-app-instance").val(old_name + '-copy').focus();
                    });
                    $('.to-instance').html('To:新的实例');
                    $('#app-instance-clone-modal').modal('show');
                } else {
                    $('#modal-confirm .modal-body').html('暂无可克隆的实例，请创建实例');
                    $('#do-confirm').unbind('click').on('click', function() {
                        $('#modal-confirm').modal('hide');
                        $('.env-new').trigger('click');
                    });
                    $('#modal-confirm').modal('show');
                }
            });

            // cancel update
            $('.stack-cancel').unbind('click').on('click', function() {
                event.preventDefault();
                $('#modal-confirm .modal-body').html('确定要取消部署实例？');
                $('#modal-confirm').modal('show');
                $('#do-confirm').unbind('click').on('click', function() {
                    var instance = $(".env-name").val();
                    var instanceCleanApi = self.api.API('appInstance', 'cancel', {
                        instance_id: instance
                    });
                    var hook = $.extend({}, self.api.loadHooks);
                    hook.success = function(msg, data) {
                        common.msgs.pop_up("取消部署成功！", 'success');
                        self.loadInstanceStatus(instance, true);
                    };
                    instanceCleanApi.load(hook);
                    $('#modal-confirm').modal('hide');
                });
            });

            // destroy app instance
            $('.env-destroy').unbind('click').on('click', function() {
                event.preventDefault();
                var instance_id = $(".env-name").val();
                if (!instance_id) {
                    common.msgs.pop_up('请先选择实例', 'error');
                    return false;
                }

                $('#modal-confirm .modal-body').html('确定要删除实例？');
                $('#modal-confirm').modal('show');
                $('#do-confirm').unbind('click').on('click', function() {
                    var instanceDestroyApi = self.api.API('appInstance', 'destroy');
                    instanceDestroyApi.apiPath += '/' + instance_id;
                    var hook = $.extend({}, self.api.loadHooks);
                    hook.beforeSend = function() {
                        common.loading.show('#modal-confirm');
                    };
                    hook.ajaxComplete = function() {
                        common.loading.hide('#modal-confirm');
                    };
                    hook.success = function(msg, data) {
                        $('#modal-confirm').modal('hide');
                        common.msgs.pop_up("删除完成！", 'success');

                        $(".env-name").select2('val', null);
                        AppManage.load($('#sel-node-group').val());
                        var instance = $(".env-name").val();
                        if (instance)
                            self.loadInstanceStatus(instance, true);

                        $('#component-box').empty();
                        $('#stack-status').addClass('btn-default').html("STOPPED");
                    };
                    instanceDestroyApi.load(hook);
                });
            });

            // restart pod
            $('#component-box').delegate('.restart-pod', 'click', function() {
                event.preventDefault();
                var pod = $(this).data('pod');
                $('#modal-confirm .modal-body').empty().html('<p>确定要重新调度？</p>');
                if (window._global.env_category == 'product') {
                    $('#modal-confirm .modal-body').append('<div class="form-group">\
                            <div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">\
                                <textarea class="form-control" name="comment" rows=5 placeholder="请说明原因"></textarea>\
                            </div>\
                        </div>');
                }
                $('#modal-confirm').modal('show');
                $('#do-confirm').unbind('click').on('click', function() {
                    var instance = $(".env-name").val();
                    var comment = $('textarea[name=comment]').val();
                    var instanceCleanApi = self.api.API('appInstance', 'podrestart', {
                        instance_id: instance,
                        pod: pod,
                        comment: comment
                    });
                    var hook = $.extend({}, self.api.loadHooks);
                    hook.beforeSend = function() {
                        common.loading.show('#modal-confirm>.modal-dialog');
                    };
                    hook.ajaxComplete = function() {
                        common.loading.hide('#modal-confirm>.modal-dialog');
                    };
                    hook.success = function(msg, data) {
                        if (window._global.env_category == 'product') {
                            common.msgs.pop_up("重新调度申请已发送，请等待审批！", 'success');
                        } else {
                            common.msgs.pop_up("开始重新调度！");
                        }
                        $('#modal-confirm').modal('hide');
                        self.loadInstanceStatus(instance);
                    };
                    instanceCleanApi.load(hook);
                });
            });
        },
        loadInstanceStatus: function(instance, is_loading) {
            var self = this;
            if (self.timer) {
                return false;
            }
            var is_loading = is_loading || false;
            var env_category = window._global.env_category;
            var box = $('#component-box').empty();
            self.instanceDetailApi = this.api.API('appInstance', 'detail', {
                action: 'paas_status'
            });
            self.instanceDetailApi.apiPath += '/' + instance;
            var hook = $.extend({}, self.api.loadHooks);
            hook.success = function(msg, data) {
                if (data.paas_status) {
                    if (data.paas_status.components) {
                        $.each(data.paas_status.components, function(i, component) {
                            var rowspan = '';
                            if (component.pods.length !== 1) {
                                rowspan = 'rowspan="' + component.pods.length + '"';
                            }
                            try {
                                var str = '<tr data-component="' + component.component_name + '">\
                                    <td ' + rowspan + '>' + component.component_name + '&nbsp;&nbsp;(' + component.pods.length + '/' + component.replicas + ')</td>\
                                    <td ' + rowspan + '>' + component.status + '</td>';
                                var url = '';
                                $.each(component.pods, function(j, pod) {
                                    if (j != 0)
                                        str += '<tr data-component="' + component.component_name + '">';

                                    var status = '';
                                    var is_ready = pod.is_ready ? "health" : "weak";
                                    switch (pod.status) {
                                        case 'Running':
                                            status = 'health';
                                            break;
                                        case 'ContainerCreating':
                                            status = is_ready = 'in_processing';
                                            break;
                                        default:
                                            status = 'weak';
                                            break;
                                    }
                                    var mem = '-';
                                    var cpu = '-';
                                    if (pod.mem_usage >= 0) {
                                        mem = pod.mem_usage + '/' + pod.mem_limit + " MB";
                                    }
                                    if (pod.cpu_percentage >= 0) {
                                        cpu = pod.cpu_percentage + '%';
                                    }
                                    str += '<td>' + pod.version + '</td>\
                                        <td>' + cpu + '</td>\
                                        <td>' + mem + '</td>\
                                        <td class="' + status + '">' + pod.status + '</td>\
                                        <td class="' + is_ready + '">' + (pod.is_ready ? "Y" : "N") + '</td>\
                                        <td>' + pod.age + '</td>\
                                        <td>' + pod.restart_count + '</td>\
                                        <td>' + pod.host_IP + '</td>';

                                    if (url == '') {
                                        if (component.svc && component.svc.ports && component.svc.ports[0] && component.svc.ports[0].port) {
                                            if (component.svc.public_addresses) {
                                                url = component.svc.public_addresses + ":" + component.svc.ports[0].port;
                                            } else if (component.svc.external_IPs) {
                                                url = component.svc.external_IPs + ":" + component.svc.ports[0].port;
                                            }
                                        }
                                        if (url != '') {
                                            str += "<td " + rowspan + "><a target='_blank' href='http://" + url + "'>" + url + "</a></td>";
                                        } else {
                                            url = null;
                                            str += "<td " + rowspan + "></td>";
                                        }
                                    }
                                    str += '<td><button class="btn btn-sm btn-red btn-fill-horz restart-pod" data-pod="' + pod.name + '">重新调度</button></td></tr>';
                                });

                                box.append(str);
                            } catch (e) {
                                console.log(e);
                            }
                            $('.loader-box').hide();
                        });
                    } else {
                        $('.loader-box').show();
                    }

                    if (data.paas_status.stack_info && data.paas_status.stack_info.stack_status) {
                        var status = data.paas_status.stack_info.stack_status;
                        $('#stack-status').html(status).removeClass().addClass('disabled btn');
                        $('.stack-cancel').hide();
                        if (status.search('COMPLETE') >= 0) {
                            $('#stack-status').addClass('btn-success');
                        } else if (status.search('DELETE') >= 0) {
                            $('#stack-status').addClass('btn-danger');
                        } else if (status.search('UPDATE_IN_PROGRESS') >= 0) {
                            $('#stack-status').addClass('btn-warning');
                            $('.stack-cancel').show();
                        } else {
                            $('#stack-status').addClass('btn-warning');
                        }
                        if (env_category != 'product') {
                            $('.env-clean').removeClass('disabled');
                            $('.env-new').removeClass('disabled');
                        }
                    } else {
                        $('#stack-status').addClass('btn-default').html("STOPPED");
                        $('.env-clean').addClass('disabled');
                        $('.env-new').addClass('disabled');
                    }
                }
            };
            hook.beforeSend = function() {
                if (is_loading)
                    common.loading.show($(".table-component"));
            };
            hook.ajaxComplete = function() {
                if (is_loading)
                    common.loading.hide($(".table-component"));
            }
            hook.fail = function(msg, data, code) {
                $('#stack-status').html("STOPPED").removeClass().addClass('disabled btn btn-default');
                $('.env-clean').addClass('disabled');
            };
            self.instanceDetailApi.load(hook);
        },
        dispose: function() {
            $(".env-name").unbind('select2:select');
            this.instanceDetailApi.ajax.abort();
        }
    });

    return widget;
});
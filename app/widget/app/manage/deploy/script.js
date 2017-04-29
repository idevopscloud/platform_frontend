define(['api', 'common', 'directives/apps', 'filesaver'], function(YM, common, appsManage) {
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
                deploy: {
                    type: 'POST',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/instance/deploy'
                },
                sync: {
                    type: 'POST',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/instance/sync'
                },
            },
            component: {
                delete: {
                    type: 'DELETE',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/components',
                    model: 'rest'
                },
            },
            deploy: {
                lists: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/deploys'
                },
            },
            posts: {
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/registry/posts'
                },
                detail: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/registry/posts'
                },
                stop_build: {
                    type: 'POST',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/registry/posts'
                },
            },
            registries: {
                detail: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/registry/registries'
                },
                push: {
                    type: 'POST',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/registry/registries'
                },
            }
        });

        this.xhr = new XMLHttpRequest();

        this.api.loadHooks = {
            beforeSend: function() {
                common.loading.show($("#deploy-box"));
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
                common.loading.hide($("#deploy-box"));
            }
        }
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function(query) {
            var self = this;
            $.fn.extend({
                textAreaAutoSize: function() {
                    var text = $(this).val(),
                        matches = text.match(/\n/g),
                        breaks = matches ? matches.length : 2;
                    $(this).attr('rows', breaks + 2);
                    return $(this);
                }
            });
            self.postApis = {};
            self.prevLoad();
            self.bindEvent();
        },
        prevLoad: function() {
            var self = this;
            if (window.location.hash != '#!/app/list') {
                $('#app-head').show();
                $('#app-head .panel-default').show();
            } else
                $('#app-head').hide();
            if (window._global.env_category == 'product')
                $('.add-componet').hide();
            else
                $('.add-componet').show();
            self.loadComponents();
        },
        bindEvent: function() {
            var self = this;
            var app_id = window._global.app_id;
            var registry_id = window._global.registry_id;
            var deploy_id = window._global.deploy_id || "";
            var env_category = window._global.env_category;

            $(".env-name").unbind('select2:select').on('select2:select', function() {
                window._global.deploy_id = '';
                self.loadComponents();
            });

            $('.add-componet').on('click', function() {
                var instance_id = $('#env-name').val();
                if (!instance_id) {
                    common.msgs.pop_up('请先选择实例', 'error');
                    return false;
                }
                window.location.hash = '#!/app/component?app_id=' + window._global.app_id + '&instance_id=' + instance_id;
            });

            $('.sync-componet').on('click', function() {
                var instance_id = $('#env-name').val();
                if (!instance_id) {
                    common.msgs.pop_up('请先选择实例', 'error');
                    return false;
                }
                $("#deploy-modal-confirm .modal-body")
                    .html(' <form class="form-horizontal" id="modal-form-clone">\
                            <div class="form-group">\
                                <label class="col-xs-3 col-sm-3 col-md-3 col-lg-3 text-right">部署历史</label>\
                                <div class="col-xs-8 col-sm-8 col-md-8 col-lg-8">\
                                    <select class="form-control" name="build_number" >\
                                    </select>\
                                </div>\
                            </div>\
                        </div>');
                var deployListsApi = self.api.API('deploy', 'lists', {
                    app_id: app_id,
                    action: 'build_number'
                });
                deployListsApi.options.async = false;
                var hook = $.extend({}, self.api.loadHooks);
                hook.success = function(msg, data) {
                    if (data && data.length > 0) {
                        $.each(data, function(_, deploy) {
                            $('select[name=build_number]').append($("<option>").val(deploy.id).text(deploy.instance_name + '#' + deploy.id));
                        });
                        $('select[name=build_number]').select2({
                            width: '100%'
                        });
                        $("#deploy-modal-confirm").modal('show');
                        $('#do-save').unbind('click').on('click', function() {
                            var instance_id = $('#env-name').val();
                            var deploy_id = window._global.deploy_id || "";
                            var params = {
                                instance_id: instance_id,
                                deploy_id: deploy_id
                            };
                            var build_number = $('select[name=build_number]').val();
                            if (!build_number) {
                                common.msgs.pop_up("请先选择部署号", 'error');
                                return false;
                            }
                            params.build_number = build_number;
                            var appInstanceDeployApi = self.api.API('appInstance', 'sync', params);
                            var hook = $.extend({}, self.api.loadHooks);
                            hook.success = function(msg, data) {
                                common.msgs.pop_up("同步成功！", 'success');
                                if (data.id)
                                    window._global.deploy_id = data.id;
                                self.loadComponents();
                            };
                            $("#deploy-modal-confirm").modal('hide');
                            appInstanceDeployApi.load(hook);
                        });
                    } else {
                        $("#deploy-modal-confirm .modal-body").html("应用尚未有成功的部署历史，无法从历史同步");
                        $("#deploy-modal-confirm").modal('show');
                        $('#do-save').unbind('click').on('click', function() {
                            $("#deploy-modal-confirm").modal('hide');
                        })
                    }


                };
                hook.beforeSend = function() {
                    common.loading.show($("#deploy-modal-confirm"));
                };
                hook.ajaxComplete = function() {
                    common.loading.hide($("#deploy-modal-confirm"));
                };
                deployListsApi.load(hook);
            });

            // deploy
            $('.btn-deploy').on('click', function() {
                var instance_id = $('#env-name').val();
                var deploy_id = window._global.deploy_id || "";
                if (!instance_id) {
                    common.msgs.pop_up('请先选择实例', 'error');
                    return false;
                }
                var image_status = 1;
                $('.image-info').each(function() {
                    if ($(this).parents('tr').data('build') && $(this).data('status') != 'SUCCESS') {
                        image_status = 0;
                        return;
                    }
                });
                if (!image_status) {
                    common.msgs.pop_up('有未成功的构建，请稍后重试', 'error');
                    return false;
                }

                $('#do-save').unbind('click').on('click', function() {
                    var comment = $('textarea[name=comment]').val();
                    var params = {
                        instance_id: instance_id,
                        deploy_id: deploy_id,
                        comment: comment
                    };
                    var build_number = $('select[name=build_number]').val();
                    if (build_number) { // product deploy
                        params.build_number = $('select[name=build_number]').val();
                    }
                    var appInstanceDeployApi = self.api.API('appInstance', 'deploy', params);
                    var hook = $.extend({}, self.api.loadHooks);
                    hook.success = function(msg, data) {
                        $("#deploy-modal-confirm").modal('hide');
                        if (env_category == 'product')
                            common.msgs.pop_up("部署申请发起成功，请等待负责人审批", 'success');
                        else {
                            common.msgs.pop_up("启动部署成功", 'success');
                            delete window._global.deploy_id; // refresh app instance
                            setTimeout(function() {
                                window.location.hash = '#!/app/status';
                            }, 1000);
                        }
                    };
                    hook.beforeSend = function() {
                        common.loading.show($("#deploy-modal-confirm>.modal-dialog"));
                    };
                    hook.ajaxComplete = function() {
                        common.loading.hide($("#deploy-modal-confirm>.modal-dialog"));
                    };
                    appInstanceDeployApi.load(hook);
                });

                var content = "<p>确定开始部署？</p>";
                if (env_category == 'product') {
                    var coms = [];
                    content = '<p>确定发起部署申请？</p>';
                    $("#component-box tr").each(function() {
                        if ($(this).data('ip-need-set')) {
                            $('#do-save').unbind('click').on('click', function() {
                                $("#deploy-modal-confirm").modal('hide');
                            });
                            coms.push($(this).data('name'));
                            content = '<p>组件（' + (coms.join(',')) + '）服务地址需要修改，请修改后重试</p>';
                        }
                    });
                    if (coms.length == 0) {
                        if ($('#component-box').find('tr.warning').length > 0) {
                            $.each($('#component-box').find('tr.warning'), function() {
                                coms.push($(this).data('name'));
                            });
                            coms = coms.join(',');
                            content = '<p>组件（' + coms + '）配置未更新，您确认在生产环境使用该配置么？</p>';
                        } else if (!deploy_id) {
                            content = '<p>实例没有任何更新,确定继续部署？</p>';
                        }
                    }
                    content += '<div class="form-group">\
                            <div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">\
                                <textarea class="form-control" name="comment" rows=5 placeholder="请填写上线说明"></textarea>\
                            </div>\
                        </div>';
                }

                $("#deploy-modal-confirm .modal-body").html(content);
                $("#deploy-modal-confirm").modal('show');
            });

            $('#component-box').delegate('.com-setting', 'click', function(event) {
                event.preventDefault();
                var com_id = $(this).parents('tr').data('id');
                var instance_id = $('#env-name').val();
                window.location.hash = '#!/app/component?app_id=' + window._global.app_id + '&instance_id=' + instance_id + '&component_id=' + com_id;
            });

            $('#component-box').delegate('.com-delete', 'click', function(event) {
                if (env_category == 'product') {
                    return;
                }
                event.preventDefault();
                var depends = []; // = $(this).data('depends');
                var com_id = $(this).parents('tr').data('id');
                var com_name = $(this).parents('tr').data('name');
                if (self.components[com_name]) {
                    $.each(self.components[com_name], function(component, _) {
                        depends.push(component);
                    });
                }
                $('#do-com-delete').data('com-id', com_id);
                $("#delete-modal-confirm .modal-body").html("确定删除该组件？");
                if (depends.length > 0) {
                    $("#delete-modal-confirm .modal-body").html('<p>该组件被(' + (depends.join(',')) + ')依赖，请手动删除其他组件依赖关系</p>');
                    $('#do-com-delete').unbind('click').on('click', function() {
                        $("#delete-modal-confirm").modal('hide');
                    });
                } else {
                    // destroy component
                    $('#do-com-delete').unbind('click').on('click', function() {
                        var deploy_id = window._global.deploy_id || "";
                        var comDeleteApi = self.api.API('component', 'delete', {
                            deploy_id: deploy_id
                        });
                        var com_id = $(this).data('com-id');
                        comDeleteApi.apiPath += '/' + com_id;
                        var hook = $.extend({}, self.api.loadHooks);
                        hook.success = function(msg, data) {
                            common.msgs.pop_up("删除成功，点部署将实际生效！", 'success');
                            if (data.deploy && data.deploy.id)
                                window._global.deploy_id = data.deploy.id;
                            self.loadComponents();
                        };
                        hook.fail = function(msg) {
                            common.msgs.pop_up("删除失败！" + msg, 'error');
                        };
                        $("#delete-modal-confirm").modal('hide');
                        comDeleteApi.load(hook);
                    });
                }
                $("#delete-modal-confirm").modal('show');
            });

            // image detail modal
            $("#component-box").delegate('button.image-info', 'click', function(event, modal_show, auto_reload) {
                var btn = $(this);
                if (btn.hasClass('disabled'))
                    return;
                if (typeof modal_show == 'undefined') {
                    modal_show = true;
                }
                if (typeof auto_reload == 'undefined') {
                    auto_reload = true;
                }
                var tr = $(this).parents('tr'),
                    build = tr.data('build'),
                    base_image = tr.data('base-image'),
                    build_num = tr.data('build-num');
                // 获取镜像构建状态
                // if (!build_num /*|| btn.hasClass('image-info')*/) {
                    var app_name = window._global.app_name,
                        name = tr.data('name'),
                        version = tr.data('version'),
                        postSearchApi = self.api.API('posts', 'list', {
                            action: 'search',
                            order_by: "updated_at,desc",
                            type: 'comp_img',
                            image: name,
                            base_image: base_image,
                            namespace: app_name,
                            tag: version
                        }),
                        image = 'app/' + window._global.app_name +'/' +name,
                        imageCheckApi = self.api.API('registries', 'detail', {action: 'images', image: image, tag: version}),
                        // imagePushApi = self.api.API('registries', 'push', {image: image, tag: version}),
                        hooks = $.extend({}, self.api.loadHooks);
                    // imagePushApi.apiPath += '/' + window._global.registry_id + '/pushimage';
                    imageCheckApi.apiPath += "/" + window._global.registry_id;
                    self.postApis[name] = postSearchApi;
                    if (!modal_show) {
                        hooks.beforeSend = function() {};
                    }
                    // btn.button('loading');
                    hooks.success = function(msg, data) {
                        // btn.button('complete');
                        var btn_console = tr.find('.console-log'),
                            btn_stop_build = tr.find('.stop-build');

                        // 取构建日志数据
                        if (data.data && data.data.length > 0) {
                            var posts = data.data;
                            var data = data.data[0];
                            $.each(posts, function(_, post) {
                                // 有成功构建则无需再次构建
                                if (post.status == 8) {
                                    data = post;
                                    return;
                                }
                            });
                            tr.data('build-num', data.build_num);
                            /*if (btn.hasClass('image-info')) {*/
                            switch (data.status) {
                                case 0:{
                                    data.status = "PENDING";
                                    btn.prop('disabled', true);
                                    break;
                                } case 1:{
                                    data.status = "IN_PROGRESS";
                                    break;
                                } case 2:{
                                    data.status = "FAILURE";
                                    break;
                                }case 4:{
                                    data.status = "ABORTED";
                                    break;
                                }case 8:{
                                    data.status = "SUCCESS";
                                    btn.prop('disabled', false);
                                    /*var btn_check = btn.siblings('.image-check'),
                                        btn_push = btn.siblings('.image-push');
                                    btn_check.show().on('click', function(){
                                        imageCheckApi.load({
                                            success : function(msg, data) {
                                                if (!data.name) { // image not exist
                                                    btn_push.show().unbind('click').on('click', function(){
                                                        imagePushApi.load({
                                                            success: function(msg, data) {
                                                                btn_push.button('complete').removeClass('btn-warning').addClass('success').html("镜像推送中");
                                                                btn_check.button('complete').html('检查镜像').show();
                                                            }
                                                        });
                                                    });
                                                    return;
                                                } else {
                                                    btn_push.button('complete').hide();
                                                    btn_check.button('complete').removeClass('btn-warning').addClass('success').prop('disabled', true).html("镜像准备完成");
                                                }
                                            }
                                        });
                                    });
                                    if (btn_check.hasClass('success') == false) {
                                        btn_check.trigger('click').button('loading');
                                    }*/
                                    break;
                                } default: {
                                    data.status = '-';
                                    break;
                                }
                            }
                            if (data.status != "PENDING")
                                btn_console.show().addClass('btn-green btn-fill-horz').prop('disabled', false);

                            if (modal_show && data.status == "SUCCESS") {
                                self.loadDockerFile(data.docker_file);
                                common.loading.hide($("#deploy-box"));
                            }

                            if (data.status == "IN_PROGRESS") { // in progress job
                                btn_stop_build.show().prop('disabled', false).data('id', data.id);
                            } else {
                                btn_stop_build.hide();
                            }

                            btn.removeClass().show()
                                .addClass('btn image-info')
                                .data('status', data.status)
                                .addClass(data.status.toLowerCase())
                                .tooltip('destroy')
                                .html(data.status + " <i class='fa fa-info-circle'></i>");
                            /*} else if (btn.hasClass('console-log')) {
                                $('.build-log').empty();
                                self.loadConsoleLog(data.build_num);
                            }*/
                        // git 接入的组件，还未开始构建
                        } else if (btn.hasClass('image-info') && build == true) {
                            btn.removeClass()
                                .show()
                                .addClass('btn image-info pending')
                                // .prop('disabled', true)
                                .html("PENDING <i class='fa fa-info-circle'></i>");
                        // 镜像接入的组件，不检查状态
                        } else if (build == false) {
                            btn.data('status', 'SUCCESS');
                        }
                    };
                    hooks.ajaxComplete = function() {
                        if (auto_reload) {
                            setTimeout(function() {
                                if (btn.data('status') != 'SUCCESS' && btn.data('status') != 'FAILURE') {
                                    btn.trigger('click', [false, true]);
                                }
                            }, 5000);
                        }
                    };
                    postSearchApi.load(hooks);
                    // 构建日志输出
                /*} else {
                    $('.build-log').empty();
                    self.loadConsoleLog(build_num);
                }*/
            });

             $("#component-box").delegate('button.console-log', 'click', function(event) {
                var tr = $(this).parents('tr'),
                    build_num = tr.data('build-num');
                $('.build-log').empty();
                self.loadConsoleLog(build_num);
             });

            // stop build event
            $("#component-box").delegate('button.stop-build', 'click', function(event, modal_show) {
                var btn = $(this);
                var id = btn.data('id');
                var build_num = btn.data('build-num');
                swal({
                        title: "确定停止构建?",
                        text: "停止的构建将无法重启!",
                        type: "warning",
                        showCancelButton: true,
                        cancelButtonText: "取消",
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "是的，停止!",
                        showLoaderOnConfirm: true,
                        closeOnConfirm: false,
                        animation: "slide-from-top",
                    },
                    function() {
                        var stopBuildApi = self.api.API('posts', 'stop_build', {
                            build_num: build_num,
                            type: 'comp_img'
                        });
                        stopBuildApi.apiPath += '/' + id + '/stop';
                        var hooks = $.extend({}, self.api.loadHooks);
                        hooks.success = function(msg, data) {
                            swal("完成！", "停止构建成功", "success");
                            btn.prop('disabled', true);
                        };
                        stopBuildApi.load(hooks);
                    }
                );
            });

            $("#component-box").delegate('button.image-repush', 'click', function(event, auto_reload) {
                $(this).hide();
                $(this).siblings('.image-checked')
                    .removeClass('image-checked')
                    .addClass('image-check')
                    .prop('disabled', false)
                    .data('build-num', null)
                    .trigger('click');
            });

            $("#component-box").delegate('button.image-check', 'click', function(event, auto_reload) {
                var tr = $(this).parents('tr'),
                    td = $(this).parents('td'),
                    name = tr.data('name'),
                    version = tr.data('version'),
                    build = tr.data('build'),
                    image_in = tr.data('image'), //镜像接入的
                    image = 'app/' + window._global.app_name + '/' + name, // git接入的
                    imageCheckApi = self.api.API('registries', 'detail', {action: 'images', type: 'push_img', image: image, tag: version,namespace: window._global.app_name, image_name: name}),
                    imagePushApi = self.api.API('registries', 'push', {image_in: image_in, build: build, image: image, namespace: window._global.app_name, image_name: name, tag: version}),
                    hooks = {},
                    btn_check = $(this).data('build-num', null).data('status', null),
                    btn_re_push = $(this).siblings('.image-repush'),
                    btn_push_log = $(this).siblings('.push-log');
                imagePushApi.apiPath += '/' + window._global.registry_id + '/pushimage';
                imageCheckApi.apiPath += "/" + window._global.registry_id;
                hooks.success = function(msg, data) {
                    var image = data.image;
                    var posts = data.posts;
                    if (!image) { // 镜像不存在
                        // $("#component-box").undelegate('button.image-check', 'click');
                        btn_check.unbind('click').removeClass('image-check');
                        if (posts && posts.length > 0) {
                            var post = posts[0];
                            if (post.status == 1 || post.status == 8 ) {
                                btn_check.button('complete').html("推送中");
                                if (post.status == 8) {
                                    btn_check.html("推送完成");
                                    btn_push_log.show()
                                        .unbind('click')
                                            .on('click', function() { // 读取推送日志
                                                $(".build-log").empty();
                                                self.loadConsoleLog(post.build_num, 'push_img');
                                            });
                                }
                                btn_check.unbind('click')
                                    .on('click', function() { // 获取job build-num and status
                                        var postDetailApi = self.api.API('posts', 'detail');
                                        postDetailApi.apiPath += '/' + post.id;
                                        postDetailApi.load({
                                            success : function(msg, data) {
                                                if (data.build_num) {
                                                    btn_check.data({'build-num': data.build_num, 'status': data.status});
                                                    if (data.status == 8) {
                                                        btn_check.removeClass('btn-warning').addClass('success').html("推送完成");
                                                    }
                                                    btn_push_log.show()
                                                        .unbind('click')
                                                            .on('click', function() { // 读取推送日志
                                                                $(".build-log").empty();
                                                                self.loadConsoleLog(post.build_num, 'push_img');
                                                            });
                                                }
                                            },
                                            ajaxComplete : function() {
                                                if (btn_check.data('status') != 8) {
                                                    if (btn_check.data('status') == 2) {
                                                        btn_check.unbind('click').removeClass('image-check').addClass('image-checked btn-warning').prop('disabled', true).html("推送失败");
                                                        btn_re_push.show();
                                                    } else {
                                                        setTimeout(function() {
                                                            btn_check.trigger('click');
                                                        }, 5000);
                                                    }
                                                } else {
                                                    btn_check.prop('disabled', true).unbind('click');
                                                }
                                            }
                                        })
                                    }).trigger('click');
                                return;
                            }
                        }
                        
                        btn_check.data('loading-text', "推送中 <i class='fa fa-circle-o-notch fa-spin'></i>").button('loading')
                            .unbind('click').on('click', function(){ // 推送镜像
                                imagePushApi.load({
                                    success: function(msg, data) {
                                        btn_check.button('complete').html("推送中");
                                        if (data.id) {
                                            if (!btn_check.data('build-num')) {
                                                btn_check.unbind('click')
                                                    .on('click', function() { // 获取job build-num and status
                                                        var postDetailApi = self.api.API('posts', 'detail');
                                                        postDetailApi.apiPath += '/' + data.id;
                                                        postDetailApi.load({
                                                            success : function(msg, data) {
                                                                if (data.build_num) {
                                                                    if (data.status == 8) {
                                                                        btn_check.removeClass('btn-warning').addClass('success').html("推送完成");
                                                                    }
                                                                    btn_check.data({'build-num': data.build_num, 'status': data.status})
                                                                    btn_push_log.show().unbind('click')
                                                                            .on('click', function() { // 读取推送日志
                                                                                $(".build-log").empty();
                                                                                self.loadConsoleLog(btn_check.data('build-num'), 'push_img');
                                                                            });
                                                                }
                                                            },
                                                            ajaxComplete : function() {
                                                                if (btn_check.data('status') != 8) {
                                                                    if (btn_check.data('status') == 2) {
                                                                        btn_check.unbind('click').removeClass('image-check').addClass('image-checked btn-warning').prop('disabled', true).html("推送失败");
                                                                        btn_re_push.show();
                                                                    } else {
                                                                        setTimeout(function() {
                                                                            btn_check.trigger('click');
                                                                        }, 5000);
                                                                    }
                                                                } else {
                                                                    btn_check.prop('disabled', true).unbind('click');
                                                                }
                                                            } 
                                                        })
                                                    }).trigger('click');
                                            } /*else {
                                                btn_check.data('build-num', data.build_num).unbind('click')
                                                    .on('click', function(){ // 推送日志
                                                        self.loadConsoleLog(btn_check.data('build-num'));
                                                    });
                                            }*/
                                        } else {
                                            btn_check.button('complete').removeClass('btn-warning').addClass('success').html("推送镜像");
                                        }
                                        // btn_check.button('complete').html('检查镜像').show();
                                    }
                                });
                            }).trigger('click');
                    } else { // 镜像准备完成
                        // btn_push.button('complete').hide();
                        btn_check.button('complete').removeClass('btn-warning').addClass('success').prop('disabled', true).html("准备完成");
                    }
                };
/*                hooks.ajaxComplete = function() {
                    if (auto_reload) {
                        setTimeout(function() {
                            if (btn_check.data('status') != 'SUCCESS') {
                                btn_check.trigger('click');
                            }
                        }, 5000);
                    }
                };*/
                imageCheckApi.load(hooks);
            });

            $('#modal-console').on('hidden.bs.modal', function() {
                self.xhr.abort();
            });

            // refresh image list
            $('.reload-image').on('click', function() {
                self.buildStatus();
            });

            // export dockerfile
            $('#do-save-as').on('click', function() {
                saveAs(
                    new Blob([$(".docker-file").html()], {
                        type: "text/plain;charset=utf8"
                    }),
                    'Dockerfile'
                );
            });
        },
        loadDockerFile: function(docker_file) {
            $('.docker-file').html(docker_file).css("overflow-y", "scroll").textAreaAutoSize();
            $('#modal-docker-file').modal('show');
        },
        loadConsoleLog: function(build_num, job) {
            var self = this;
            if (typeof job == 'undefined') {
                job = 'comp_img';
            }
            var url = 'http://' + cors_config.registry_host + '/console/' + build_num + '?type='+job+'&token=' + window.localStorage.token;
            self.xhr = new XMLHttpRequest();
            var start = 0;
            var close = 0;
            var reconnect = function() {
                self.xhr.open('GET', url + "&start=" + start, true);
                self.xhr.onprogress = function() {
                    if (self.xhr.readyState != 2 && self.xhr.readyState != 3 && self.xhr.readyState != 4)
                        return;
                    if (self.xhr.readyState == 3 && self.xhr.status != 200) {
                        close = 1;
                        return;
                    }

                    start = self.xhr.getResponseHeader('x-text-size');
                    var info = self.xhr.response.replace(/\\r\\n|\\n|\\r/g, "<br />").replace(/["]+/g, '');
                    if (info == 'false') {
                        return;
                    }
                    $("<div>").html(info).hide().appendTo(".build-log").fadeIn(1500);
                    setTimeout(function() {
                        $('.build-log').show().animate({
                            scrollTop: $(".build-log").prop('scrollHeight')
                        }, 1000)
                    }, 1000);
                    if (info.search('Finished:') > 0) {
                        close = 1;
                    }
                }
                self.xhr.send();
            };
            reconnect();
            $('#modal-console').modal('show');
            self.xhr.onload = function() {
                console.log("reconnecting...");
                if (!close) {
                    setTimeout(reconnect, 3000);
                }
            }
            self.xhr.onerror = function() {
                console.log("reconnecting after error...");
                if (!close)
                    reconnect();
            }
            self.xhr.onabort = function() {}
        },
        loadComponents: function() {
            var self = this;
            var box = $('#component-box').empty();
            var instance_id = $(".env-name").val();
            if (!instance_id) {
                return;
            }
            var param = {};
            if (window._global.deploy_id) {
                param.deploy_id = window._global.deploy_id;
            }
            var instanceDetailApi = this.api.API('appInstance', 'detail', param);
            instanceDetailApi.apiPath += '/' + instance_id;
            self.components = {};
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                if (data && data.components && data.components.length > 0) {
                    $('.btn-deploy').removeClass('disabled');
                    var diff = data.diff_components;
                    var nodes = data.nodes;

                    $.each(data.components, function(_, component) {
                        var definition = JSON.parse(component.definition),
                            depends = [], // dependency
                            mem = '', // memory limits
                            replicas = '', // replica number
                            version = '', // tag number
                            url = '', // access url address
                            new_comp = '', // new component
                            disabled = '', // disable action
                            build = false, // comp build by git
                            base_image = '', // comp build from OS+Lib Image
                            image = '',
                            ip_need_set = false; // ip:0.0.0.0 need to reset 
                        $.each(definition, function(rc_or_svc, com) {
                            if (rc_or_svc.search('-rc') > 0) {
                                try {
                                    $.each(com.depends_on, function(_, depend) {
                                        var depended_com = depend.substr(0, depend.lastIndexOf('-'));
                                        if (!self.components[depended_com]) {
                                            self.components[depended_com] = {};
                                        }
                                        self.components[depended_com][component.name] = 1;
                                        depends.push(depended_com);
                                    });

                                    replicas = com.properties.definition.spec.replicas;
                                    version = com.properties.definition.spec.selector.version;
                                    mem = com.properties.definition.spec.template.spec.containers[0].resources.requests.memory + '~' + com.properties.definition.spec.template.spec.containers[0].resources.limits.memory;
                                    mem = mem.replace(/Mi/g, 'MB');
                                    image = com.properties.definition.spec.template.spec.containers[0].image;
                                } catch (e) {
                                    console.log(e);
                                }
                                if (com.build && com.build.git) {
                                    component.build = com.build;
                                }
                            } else if (rc_or_svc.search('-svc') > 0 && component.node && component.port) {
                                url = component.node + ":" + component.port;
                                if (component.node == '0.0.0.0') {
                                    ip_need_set = true;
                                }
                            }

                        });

                        // #hack prod
                        if (window._global.env_category == 'product') {
                            disabled = 'disabled';
                            if (diff && diff[component.id]) {
                                new_comp = 'warning';
                            }
                        }

                        if (component.build) { // git repo
                            build = true;
                            if (component.build.sync_from) {
                                image = component.build.sync_from;
                            }
                        }
                        var tr = $("<tr>\
                                <td>" + component.name + "</td>\
                                <td>" + version + "</td>\
                                <td>" + replicas + "</td>\
                                <td>" + mem + "</td>\
                                <td>" + (depends ? depends : "") + "</td>\
                                <td>" + url + "</td>\
                                <td>\
                                    <button class='btn btn-warning image-info' style='display: none' data-loading-text=\"状态获取中 <i class='fa fa-circle-o-notch fa-spin'></i>\">\
                                        <i class='fa fa-info-circle'></i>\
                                    </button>\
                                    <button class='btn btn-default console-log' disabled style='display: none'>构建日志</button>\
                                    <button class='btn btn-default btn-red btn-fill-horz stop-build' disabled style='display: none'>停止构建</button>\
                                </td>\
                                <td>\
                                    <button class='btn btn-warning image-check' data-loading-text=\"检测中 <i class='fa fa-circle-o-notch fa-spin'></i>\">镜像检测 </button>\
                                    <button class='btn btn-warning image-repush' style='display: none' data-loading-text=\"推送中 <i class='fa fa-circle-o-notch fa-spin'></i>\">重新推送 </button>\
                                    <button class='btn btn-default push-log btn-green btn-fill-horz' style='display: none'>推送日志</button>\
                                </td>\
                                <td>\
                                    <button class='btn com-setting cbutton cbutton--effect-ivana'>设置</button>\
                                    <button class='btn com-delete cbutton cbutton--effect-ivana " + disabled + "' data-depends=" + (depends ? depends : "") + ">删除</button>\
                                </td>\
                            </tr>");
                        tr.addClass(new_comp)
                            .data({
                                id: component.id,
                                version: version,
                                name: component.name,
                                build: build,
                                image: image,
                                'base-image': base_image,
                                'ip-need-set': ip_need_set
                            });
                        box.append(tr);
                    });
                    self.buildStatus();
                    self.imageStatus();
                } else {
                    $('.btn-deploy').addClass('disabled');
                }
            }

            instanceDetailApi.load(hooks);
        },
        buildStatus: function() {
            $('.image-info').each(function() {
                $(this).trigger('click', [false, true]);
            });
        },
        imageStatus: function() {
            $('.image-check').each(function() {
                $(this).trigger('click', [false, true]);
            });
        },
        dispose: function() {
            $(".env-name").unbind('select2:select');
            $.each(this.postApis, function(_, api) {
                api.ajax.abort();
            });
        }
    });

    return widget;
});
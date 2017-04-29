define(['api', 'common', 'select2', 'pages', 'fileinput', 'fileinput_locale_zh', 'jquery.validate', 'validate_localization/messages_zh'], function(YM, common) {
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
                detail: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/apps',
                    model: 'rest'
                },
                create: {
                    type: 'POST',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/apps'
                },
                update: {
                    type: 'PUT',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/apps',
                    model: 'rest'
                },
            },
            env: {
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/envs'
                },
                detail: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 120,
                    url: 'third/app/app/envs',
                    model: 'rest'
                },
            },
            user: {
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'v1/users',
                    model: 'rest'
                },
            },
            group: {
                detail: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'v1/groups',
                    model: 'rest'
                },
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
                common.loading.show($('.app-settings'));
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
                common.loading.hide($('.app-settings'));
            }
        };
        this.free = true;
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function(query) {
            var self = this;
            self.preLoad(query);
            self.bindEvent(query);
        },
        preLoad: function(query) {
            var self = this,
                app_id = query.app_id || '',
                form = $('#form-app-new'),
                userListApi = self.api.API('user', 'list', {key: 'name'}),
                ngListApi = self.api.API('ng', 'list', {action: 'team'}),
                userHooks = $.extend({}, self.api.loadHooks),
                ngHooks = $.extend({}, self.api.loadHooks);
            userHooks.success = function(msg, data) {
                var member_select = $('.member-search')
                $.each(data, function(id, name) {
                    var option = $('<option>').val(id).text(name);
                    member_select.append(option);
                });
            };
            userListApi.load(userHooks);

            ngHooks.success = function(msg, data) {
                var box = $('.ng-box')
                $.each(data, function(_, ng) {
                    var nodes = [];
                    $.each(ng.nodes, function(_, node){
                        nodes.push(node.ipaddress);
                    });
                    box.append('\
                    <tr><td class="collapsing">\
                        <div class="ui fitted slider checkbox">\
                            <input name="ngs[]" value="'+ng.id+'" text="'+ng.name+'" type="checkbox"> <label></label>\
                        </div>\
                    </td>\
                    <td>' + ng.name + '</td>\
                    <td>' + nodes + '</td>\
                    </tr>');
                });
            };
            ngHooks.beforeSend = function(msg) {
                common.loading.hide($('#ngs'));
            };
            ngHooks.ajaxComplete = function(textStatus) {
                common.loading.hide($('#ngs'));
            };
            ngListApi.options.async = false;    
            ngListApi.load(ngHooks);
            self.fillFormData(app_id); 
        },
        validateBasic: function() { //验证基本信息
            if (!$('input[name=app_icon_path]').val() || !$('input[name=app_icon_path]').data('uploaded')) {
                common.msgs.pop_up('请上传应用图标', 'error');
                return false;
            }

            if ($('.table-member tbody').find('tr').length <= 0) {
                common.msgs.pop_up('请添加成员', 'error');
                return false;
            }
            var master = false;
            $('.table-member tbody').find('tr').each(function() {
                var role = $(this).find('td').last().html();
                if (role == '负责人')
                    master = true;
            });
            if (!master) {
                common.msgs.pop_up('请添加一位负责人', 'error');
                return false;
            }
            return true;
        },
        bindEvent: function(query) {
            var self = this;
            var form = $('#form-app-new');
            var app_id = query.app_id || '';
            $.validator.addMethod("regex", function(value, element, params) {
                return (this.optional(element) == true) || params.test(value);
            });
            var first_step_rules = {
                app_icon_path: {
                    required: true
                },
                name: {
                    required: true,
                    rangelength: [5, 50],
                    regex: /^[a-z][a-z0-9-]*[a-z0-9]$/,
                },
                description: {
                    required: true,
                    minlength: 10
                }
            };
            if (app_id) {
                delete first_step_rules.name;
            }

            // members setting
            $('.member-search').select2({
                data: []
            });

            $('#member-settings').delegate('li a', 'click', function(event) {
                event.preventDefault();
                var role = $(this).data('role');
                var user_ids = $('.member-search').val();
                if (!user_ids)
                    return;
                $.each(user_ids, function(i, user_id) {
                    var exist = false;
                    var user_name = $('.member-search').find('option[value="' + user_id + '"]').text()
                    var input_name = 'users[' + role + '][]';
                    var exist = false;
                    $('input[name="' + input_name + '"').each(function() {
                        if ($(this).val() == user_id) {
                            exist = true;
                        }
                    })
                    if (exist) {
                        common.msgs.pop_up('角色成员已存在！', 'error');
                        return false;
                    }
                    var td_name = $('<td class="td-user">').html(user_name).data('user-id', user_id);
                    var td_role = $('<td>').data('role', role);
                    if (role == 'member') {
                        td_role.html("开发测试");
                    } else {
                        td_role.html("负责人");
                    }
                    var row = $('<tr>').append('<td><i class="fa fa-square-o" aria-hidden="true"></i></td>').append(td_name).append(td_role);
                    $('.table-member tbody').append(row);
                    var input = $('<input type="hidden">').attr('name', 'users[' + role + '][]').val(user_id);
                    form.append(input);
                    $('.member-search').select2('val', null)
                });
            });

            $('.table-member tbody').delegate('tr', 'click', function() {
                if ($(this).hasClass('active')) {
                    $(this).removeClass('active');
                    $(this).find(".fa").removeClass('fa-check-square-o').addClass('fa-square-o');
                } else {
                    $(this).addClass('active');
                    $(this).find(".fa").removeClass('fa-square-o').addClass('fa-check-square-o');
                }
            });

            $('.do-remove-member').on('click', function(event) {
                event.preventDefault();
                $('.table-member .active').each(function() {
                    var user_id = $(this).find('td.td-user').data('user-id');
                    var role = $(this).find('td').last().data('role');
                    $('input[name^="users[' + role + ']"').each(function() {
                        if ($(this).val() == user_id) {
                            $(this).remove();
                        }
                    })
                });
                $('.table-member .active').remove();
            })

            $('.do-free-new').on('click', function(event) {
                event.preventDefault();
                var hooks = $.extend({}, self.api.loadHooks);
                form.validate({
                    lang: 'zh',
                    rules: first_step_rules,
                    messages: {
                        name: "允许小写英文字母、数字和中划线。以字母开头，字母或者数字结尾，且长度在5~50之间",
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
                    return false;
                }
                if (!self.validateBasic())
                    return false;
                if (app_id) {
                    var appUpdateApi = self.api.API('app', 'update', form.serialize());
                    appUpdateApi.apiPath += '/' + app_id;
                    hooks.success = function(msg, data) {
                        common.msgs.pop_up('更新完成', 'success');
                        window.location.hash = '#!/manage/app';
                    }
                    appUpdateApi.load(hooks);
                } else {
                    var createApi = self.api.API('app', 'create', form.serialize());
                    hooks.success = function(msg, data) {
                        common.msgs.pop_up('创建成功', 'success');
                        window.location.hash = '#!/manage/app';
                    };
                    createApi.load(hooks);
                }

            }); // do-new done

            var resource_selected = [];
            // remove node
            $('#resource-box').delegate('.table-node-bind tbody tr', 'click', function() {
                var resource_id = $(this).parents('section').attr('id');
                var node = $(this).children().first().html();
                var env = $(this).find('select').data('env');
                $(this).remove();
                $('#' + resource_id + ' .table-node td').each(function() {
                    if ($(this).html() == node)
                        $(this).removeClass('active');
                });
                var others = $('.env-select[data-resource-id!="' + resource_id + '"]');
                if ($('select[name^="nodes[' + resource_id + '][' + env + ']"]').length == 0 && others.length > 0) { //释放其他section的环境禁用
                    others.select2('destroy');
                    others.find('option[value="' + env + '"]').prop('disabled', false);
                    others.select2({
                        minimumResultsForSearch: -1,
                        width: '100%'
                    });
                }
            });

            // file upload
            var fileParam = {
                language: "zh",
                uploadUrl: 'http://' + cors_config.app_host + '/upload/',
                uploadAsync: true,
                autoReplace: true,
                overwriteInitial: true,
                showUploadedThumbs: false,
                showBrowse: false,
                browseOnZoneClick: true,
                showClose: false,
                showCaption: false,
                removeLabel: '',
                maxFileCount: 1,
                maxFileSize: 1024, // kb 
                allowedFileExtensions: ['jpg', 'png'],
                dropZoneTitle: "拖拽图片至此...",
                previewFileIcon: '<i class="fa fa-file"></i>',
                initialPreview: [

                ],
                initialCaption: '',
                initialPreviewShowDelete: true,
                defaultPreviewContent: '<img src="app/libs/fileinput/img/landscape-photo-256.png" alt="应用图标" style="height:199px"><h6 class="text-muted">选择图片</h6>',
                layoutTemplates: {
                    main2: '{preview}'
                },
            };
            var initialPreview = $("#app-icons").data('preview');
            var initialCaption = $("#app-icons").data('name');
            if (initialPreview && initialCaption) {
                fileParam.initialPreview.push("<img src='" + initialPreview + "'>");
                $('input[name=app_icon_path]').val($("#app-icons").data('icon')).data('uploaded', true);
                fileParam.initialCaption = initialCaption;
            }
            $('#app-icons').fileinput(fileParam).on('fileuploaded', function(event, data, previewId, index) {
                var form = data.form,
                    files = data.files,
                    extra = data.extra,
                    response = data.response,
                    reader = data.reader;
                $('input[name=app_icon_path]').val(response.filename).data('uploaded', true);
            });

            // resource-settings
            $('.nav-env-settings').delegate('li a', 'click', function(event) {
                event.preventDefault();
                $(this).parent('li').siblings().removeClass('active');
                $(this).parent('li').addClass('active');
                var hash = this.hash;
                $("section" + hash).siblings("section").hide('slide');
                $("section" + hash).show('slide');
            });
        },
        fillFormData: function(app_id) {
            var self = this;
            if (!app_id) {
                return;
            }
            var appDetailApi = self.api.API('app', 'detail'),
                hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                self.fillBindedMembers(data.role_group_id);
                self.fillBindedNgs(data.node_groups);
                $("input[name='name']").val(data.name).prop('disabled', true);
                $("input[name='code_name']").val(data.code_name);
                $("textarea[name='description']").text(data.description);
                $("#app-icons").data('icon', data.icon)
                    .data('preview', 'http://' + cors_config.app_host + '/' + data.icon)
                    .data('name', data.icon.substr(data.icon.search('/') + 1));
            }
            appDetailApi.options.async = false;
            appDetailApi.apiPath += '/' + app_id;
            appDetailApi.load(hooks);
        },
        fillBindedMembers: function(role_group_id) {
            var self = this,
                form = $('#form-app-new'),
                groupDetailApi = self.api.API('group', 'detail');
            if (role_group_id == 0) {
                return;
            }
            groupDetailApi.apiPath += '/' + role_group_id;
            groupDetailApi.load({
                success: function(msg, data) {
                    if (!data.roles)
                        return;
                    $.each(data.roles, function(_, role) {
                        if (!role.users)
                            return;
                        role.name = role.name.substr(role.name.lastIndexOf('-') + 1);
                        $.each(role.users, function(_, user) {
                            var td_name = $('<td class="td-user">').html(user.nickname).data('user-id', user.id);
                            var td_role = $('<td>').data('role', role.name);
                            if (role.name == 'member') {
                                td_role.html("开发测试");
                            } else {
                                td_role.html("负责人");
                            }
                            var row = $('<tr>').append('<td><i class="fa fa-square-o" aria-hidden="true"></i></td>')
                                .append(td_name)
                                .append(td_role);
                            $('.table-member tbody').append(row);

                            var input = $('<input type="hidden">').attr('name', 'users[' + role.name + '][]').val(user.id);
                            form.append(input);
                        });
                    });
                },
                fail: function(msg, data, code) {
                    common.msgs.pop_up(msg, 'error');
                },
                ajaxFail: function(msg) {
                    common.msgs.pop_up(msg, 'error');
                }
            });
        },
        fillBindedNgs: function(ngs) {
            $("input[name='ngs[]']").each(function(){
                for(var i in ngs) {
                    if ($(this).val() == ngs[i].id) {
                        var instances = [];
                        if (ngs[i].instances && ngs[i].instances.length > 0) {
                            $.each(ngs[i].instances, function(_,instance){
                                instances.push(instance.name);
                            });
                        }
                        $(this).prop('checked', true).data({name: ngs[i].name, instances: instances});
                    } 
                }
            }).on('click', function() {
                var instances = $(this).data('instances'),
                    name = $(this).data('name');
                if (instances) {
                    if( $(this).is(':checked') == false )  {
                        common.msgs.pop_up("该应用在环境（"+name+"）绑定了实例（" + instances + "）无法解除绑定，请先删除实例", 'error');
                        $(this).prop('checked', true);
                    }
                }
            });
        },
        dispose: function() {

        }
    });

    return widget;
});
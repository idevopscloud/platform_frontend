define(['api', 'common', 'select2', 'pages', 'fileinput','jquery.validate', 'validate_localization/messages_zh'], function (YM, common) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            caas: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/caas/caass'},
                detail: {type: 'GET', dataType: 'JSON', timeout: 60, url:'third/caas/caass', model: 'rest'},
                create: {type: 'POST', dataType: 'JSON', timeout: 60, url:'third/caas/caass'},
                update: {type: 'PUT', dataType: 'JSON', timeout: 60, url:'third/caas/caass', model: 'rest'},
            },
            env: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/caas/caas/envs'},
                detail: {type: 'GET', dataType: 'JSON', timeout: 120, url:'third/caas/caas/envs', model: 'rest'},
            },
            user: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'v1/users', model: 'rest'},
            },
            group: {
                detail: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'v1/groups', model: 'rest'},
            },
        });
        this.api.loadHooks = {
            beforeSend: function() {
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
                        if (field !== 'nodes'){
                            $(".do-previous").trigger('click');
                        }
                        msgs += error+"\n";
                    });
                    msg = msgs;
                }
                common.msgs.pop_up(msg, 'error');
            },
            ajaxFail : function(msg) {
                common.msgs.pop_up(msg, 'error');
            },
            ajaxComplete: function(textStatus) {
                common.loading.hide(self.dom);
            }
        }
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function (query) {
            var self = this;
            this.preLoad (query);
            this.bindEvent (query);
        },
        preLoad: function (query) {
            var self = this;
            var caas_id = query.caas_id || '';
            var form = $('#form-caas-new');
            var nodes = [];
            var node_groups = [];
            fillFormData(caas_id);

            (function fillMemberData() {
                var userListApi = self.api.API('user', 'list', {key: 'name'});
                userListApi.load({
                    success: function(msg, data) {
                        var member_select = $('.member-search')
                        $.each(data, function(id, name){
                            var option = $('<option>').val(id).text(name);
                            member_select.append(option);
                        });
                    },
                    fail: function(msg,data,code){
                        common.msgs.pop_up(msg, 'error');
                    },
                    ajaxFail : function(msg){
                        common.msgs.pop_up(msg, 'error');
                    }
                });
            })();

            function fillFormData(caas_id) {
                if (!caas_id) {
                    return;
                }
                var caasDetailApi = self.api.API('caas', 'detail');
                caasDetailApi.options.async = false;
                caasDetailApi.apiPath += '/'+caas_id;
                var hooks = $.extend({},self.api.loadHooks);
                var caas_name;
                hooks.success = function(msg, data) {
                    fillBindedMembers(data.role_group_id);
                    caas_name = data.name;
                    $("input[name='name']").val(data.name);
                    $("input[name='code_name']").val(data.code_name);
                    $("textarea[name='description']").text(data.description);
                    $("#caas-icons").data('icon',data.icon)
                        .data('preview', 'http://'+cors_config.caas_host+'/'+data.icon)
                        .data('name', data.icon.substr(data.icon.search('/')+1));
                    nodes = data.nodes;
                    node_groups = data.node_groups;
                }
                caasDetailApi.load(hooks);
            }

            function fillBindedMembers(role_group_id) {
                if (role_group_id == 0) {
                    return;
                }
                var groupDetailApi = self.api.API('group', 'detail');
                groupDetailApi.apiPath += '/'+role_group_id;
                groupDetailApi.load({
                    success: function(msg, data) {
                        self.selected_members = [];
                        if (!data.roles)
                            return;
                        $.each(data.roles, function(_, role){
                            if (!role.users)
                                return;
                            role.name = role.name.substr(role.name.lastIndexOf('-')+1);
                            $.each(role.users, function(_, user){
                                // self.selected_members.push({name: user.id, role: role.name});
                                var td_name = $('<td>').html(user.nickname).data('user-id', user.id);
                                var td_role = $('<td>').html(role.name);
                                var row = $('<tr>').append(td_name).append(td_role);
                                $('.table-member tbody').append(row);
                                var input = $('<input type="hidden">').attr('name', 'users['+role.name+'][]').val(user.id);
                                form.append(input);
                            });
                        });
                    },
                    fail: function(msg,data,code){
                        common.msgs.pop_up(msg, 'error');
                    },
                    ajaxFail : function(msg){
                        common.msgs.pop_up(msg, 'error');
                    }
                });
            }

        },
        bindEvent: function (query) {
            var self = this;
            var form = $('#form-caas-new');
            var caas_id = query.caas_id||'';
            $.validator.addMethod("regex", function(value, element,params) {
                return (this.optional(element) == true) || params.test(value);
            });
            var first_step_rules = {
                    caas_icon_path: {required:true},
                    name: {required:true, rangelength: [5, 50], regex:/^[a-z][a-z0-9-]*[a-z0-9]$/,},
                    /*code_name: {required:true,minlength: 5},*/
                    description: {required:true,minlength: 10}
                };

            // step settings
            $('.do-next').on('click', function(event) {
                event.preventDefault();
                var validator = form.validate({
                    lang: 'zh',
                    rules: first_step_rules,
                    messages: {
                        name: "允许小写英文字母、数字和中划线。以字母开头，字母或者数字结尾，且长度在3~50之间",
                    },
                    errorPlacement: function(error, element) {
                        $( element )
                            .closest( "form" )
                                .find( "label[for='" + element.attr( "id" ) + "']" )
                                    .append( error );
                    },
                    errorElement: "span"
                });
                if (form.valid() == false) {
                    validator.focusInvalid();
                    return false;
                }

                if (!$('input[name=caas_icon_path]').val()) {
                    common.msgs.pop_up('图标未成功上传，请重试', 'error');
                    return false;
                }

                if ($('.table-member tbody').find('tr').length <= 0) {
                    common.msgs.pop_up('请先添加成员', 'error');
                    return false;
                }
            });

            // members setting
            $('.member-search').select2({data:[],tags: true});
            $('.member-add').on('click', function(event) {
                event.preventDefault();
                var user_ids = $('.member-search').val();
                var selected_user_ids = $('input[name="users"]').val().split(',');
                $.each(user_ids, function(i, user_id) {
                    if (selected_user_ids.indexOf(user_id.toString()) > 0) {
                        var user_name = $('.member-search').find('option[value="'+user_id+'"]').text();
                        var row = $('<tr>').append($('<td>').html(user_name).data('user-id', user_id));
                        $('.table-member tbody').append(row);
                    }   
                });
            });

            $('.table-member tbody').delegate('tr', 'click', function() {
                if ($(this).hasClass('active'))
                    $(this).removeClass('active');
                else
                    $(this).addClass('active');
            });

            $('.do-remove-member').on('click', function(event) {
                event.preventDefault();
                $('.table-member .active').each(function() {
                    var user_id = $(this).find('td').first().data('user-id');
                    var selected_user_ids = $('input[name="users"]').val().split(',');
                    var index = selected_user_ids.indexOf(user_id.toString());
                    selected_user_ids.splice(index, 1);
                });
                $('.table-member .active').remove();
            })

            $('.do-new').on('click', function(event) {
                event.preventDefault();
                form.validate({
                    lang: 'zh',
                    rules: second_step_rules,
                    errorPlacement: function(error, element) {
                        $( element )
                            .closest( "form" )
                                .find( "label[for='" + element.attr( "id" ) + "']" )
                                    .append( error );
                    },
                    errorElement: "span"
                });
                if (form.valid() == false) {
                    return false;
                }

                var params = {};
                $.each(form.serializeArray(), function(_, kv) {
                    params[kv.name] = kv.value;
                });
                var hooks = $.extend({},self.api.loadHooks);
                if (caas_id) {
                    var caasUpdateApi = self.api.API('caas', 'update', params);
                    caasUpdateApi.apiPath += '/'+caas_id;
                    hooks.success = function(msg, data) {
                        common.msgs.pop_up('更新完成', 'success');
                        window.location.hash = '#!/manage/caas';
                    }
                    caasUpdateApi.load(hooks);
                } else {
                    var createApi = self.api.API('caas', 'create', params);
                    hooks.success = function(msg, data){
                        common.msgs.pop_up('创建成功', 'success');
                        window.location.hash = '#!/manage/caas';
                    };
                    createApi.load(hooks);
                }
                
            }); // do-new done


            // file upload
            var fileParam = {
                uploadUrl: "http://caas.idevops.net/upload/",
                uploadAsync: true,
                autoReplace: true,
                overwriteInitial: true,
                showUploadedThumbs: false,
                maxFileCount: 1,
                maxFileSize: 1024, // kb 
                allowedFileExtensions : ['jpg', 'png'],
                dropZoneTitle: "拖拽图片至此...",
                previewFileIcon: '<i class="fa fa-file"></i>',
                allowedPreviewTypes: null, // set to empty, null or false to disable preview for all types
                previewFileIconSettings: {
                    'docx': '<i class="fa fa-file-word-o text-primary"></i>',
                    'xlsx': '<i class="fa fa-file-excel-o text-success"></i>',
                    'pptx': '<i class="fa fa-file-powerpoint-o text-danger"></i>',
                    'jpg': '<i class="fa fa-file-photo-o text-warning"></i>',
                    'pdf': '<i class="fa fa-file-pdf-o text-danger"></i>',
                    'zip': '<i class="fa fa-file-archive-o text-muted"></i>',
                },
                initialPreview: [
                    
                ],
                initialCaption: '',
                initialPreviewShowDelete: true,
            };
            /*var initialPreview = $("#caas-icons").data('preview');
            var initialCaption = $("#caas-icons").data('name');
            if (initialPreview && initialCaption) {
                fileParam.initialPreview.push("<img src='"+initialPreview+"'>");
                $('input[name=caas_icon_path]').val($("#caas-icons").data('icon'));
                fileParam.initialCaption = initialCaption;
            }*/
            $("#caas-icons").fileinput(fileParam).on('fileuploaded', function(event, data, previewId, index) {
                var form = data.form, files = data.files, extra = data.extra,
                    response = data.response, reader = data.reader;
                $('input[name=caas_icon_path]').val(response.filename);
            });
        },
        dispose : function () {
            
        }
    });

    return widget;
});

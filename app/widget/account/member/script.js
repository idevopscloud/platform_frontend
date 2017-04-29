define(['api', 'common', 'select2', 'select2.lang.zh', 'jquery.validate', 'validate_localization/messages_zh', 'pages', 'semantic'], function (YM, common) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;
        this.api = new YM();
        this.api.API_LIST({
            user: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/account/users'},
                add: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'third/account/users'},
                update: {type: 'PUT', dataType: 'JSON', timeout: 60, url: 'third/account/users'},
                destroy: {type: 'DELETE', dataType: 'JSON', timeout: 60, url: 'third/account/users'},
            },
            company: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/account/companies'},
                add: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'third/account/companies'},
                update: {type: 'PUT', dataType: 'JSON', timeout: 60, url: 'third/account/companies'},
                destroy: {type: 'DELETE', dataType: 'JSON', timeout: 60, url: 'third/account/companies'},
            }
        });
        this.api.loadHooks = {
            beforeSend: function() {
            },
            fail: function(msg,data,code) {
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
            }
        }
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function (query) {
            var self = this;
            self.userData = {};
            self.companyData = {};
            $.validator.addMethod("regex", function(value, element,params) {
                return (this.optional(element) == true) || params.test(value);
            });
            $.validator.addMethod("valueNotEquals", function(value, element, arg){
                return arg != value;
            });

            self.preLoad (query);
            self.bindEvent(query);
        },
        preLoad: function (query) {
            var self = this;
            var page = query.page || 1;
            self.loadUsers(page);
        },
        bindEvent: function(query) {
            var self = this;
            var page = query.page || 1;

            /*$('#user-modal-new').on('hidden.bs.modal', function () {
                $('#user-form-new').find('input').val('').removeClass("error success").tooltip("destroy");
            });*/

            $('.nav-settings').delegate('li', 'click', function(event) {
                event.preventDefault();
                var section = $(this).data('section');
                $(this).siblings().removeClass('active');
                $(this).addClass('active');
                $("#sec_"+section).show().siblings('section').hide();
                self.loadData(section, 1);
            });

            $('.add-user').on('click', function() {
                var form = $('#user-form-new');
                $(".reset-pwd").hide();
                form.find('input[name=password]').parents('.form-group').show();
                form.find('input[name=password_again]').parents('.form-group').show();
                form.find('select[name=company_id]').parents('.form-group').show();
                form.find('input').val('');
                $('#user-modal-new').modal('show');
                $('#user-modal-new #do-new').unbind('click').on('click', function(){
                    if (self.validateUser('create') == false) {
                        return false;
                    }
                    var UserAddApi = self.api.API('user', 'add', form.serialize()),
                        hooks = $.extend({}, self.api.loadHooks);
                    hooks.success = function(msg, data) {
                        $('#user-modal-new').modal('hide');
                        common.msgs.pop_up("成员创建成功!", 'success');
                        self.loadUsers();
                    };
                    hooks.beforeSend = function () {
                        // common.loading.show($('#user-modal-new'));
                    };
                    hooks.ajaxComplete = function() {
                        $("#do-new").button("reset");
                        // common.loading.hide($('#user-modal-new'));
                    };
                    UserAddApi.load(hooks);
                    $("#do-new").button("loading");
                    return false;
                });
            });

            $(".reset-pwd").on('click', function(){
                var form = $('#user-form-new');
                form.find('input[name=password]').val("").parents('.form-group').toggle();
                form.find('input[name=password_again]').val("").parents('.form-group').toggle();
            });

            $('#user-box').delegate('.user-setting', 'click', function(){
                var id = $(this).parents('tr').data('id');
                var form = $('#user-form-new');
                var data = self.userData[id];
                form.find('input').val('');
                $.each(data, function(key, val) {
                    form.find("input[name='"+key+"']").val(val);
                });
                $(".reset-pwd").show();
                form.find('select[name=company_id]').parents('.form-group').hide();
                form.find('input[name=password]').parents('.form-group').hide();
                form.find('input[name=password_again]').parents('.form-group').hide();

                $('#user-modal-new').modal('show');
                $('#user-modal-new #do-new').unbind('click').on('click', function(){
                    if (self.validateUser() == false) {
                        return false;
                    } 
                    var UserUpdateApi = self.api.API('user', 'update', form.serialize());
                    UserUpdateApi.apiPath += '/'+id;
                    var hooks = $.extend({}, self.api.loadHooks);
                    hooks.success = function(msg, data) {
                        $('#user-modal-new').modal('hide');
                        common.msgs.pop_up("更新成员成功!", 'success');
                        self.loadUsers(page);
                    };
                    hooks.beforeSend = function () {
                        // common.loading.show($('#user-modal-new>.modal-dialog'));
                    };
                    hooks.ajaxComplete = function() {
                        $("#do-new").button("reset");
                        // common.loading.hide($('#user-modal-new>.modal-dialog'));
                    };
                    UserUpdateApi.load(hooks);
                    $("#do-new").button("loading");
                    return false;
                }); 
            });

            $('#user-box').delegate('.user-remove', 'click', function(){
                var id = $(this).parents('tr').data('id');
                $('#modal-confirm .modal-body').html("确认删除成员吗？");
                $('#modal-confirm').modal('show');
                $('#modal-confirm #do-action').unbind('click').on('click', function(){
                    
                    var UserDestroyApi = self.api.API('user', 'destroy');
                    UserDestroyApi.apiPath += '/'+id;
                    var hooks = $.extend({}, self.api.loadHooks);
                    hooks.success = function(msg, data) {
                        $('#modal-confirm').modal('hide');
                        common.msgs.pop_up("删除成功!", 'success');
                        self.loadUsers(page);
                    };
                    hooks.beforeSend = function () {
                    };
                    hooks.ajaxComplete = function() {
                        $("#do-action").button("reset");
                    };
                    UserDestroyApi.load(hooks);
                    $("#do-action").button("loading");
                    return false;
                }); 
            });
        },
        loadData: function(section, page) {
            var self = this;
            if (section == 'user') {
                self.loadUsers(page);
            } else {
                self.loadCompanies(page);
            }
        },
        loadUsers: function(page) {
            var self = this;
            var userListApi = self.api.API('user', 'list', {page: page});
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                var box = $('#user-box').empty();
                $.each(data.data, function(_, user) {
                    var tr = $('<tr>').data('id', user.id);
                    tr.append($('<td>').html(user.nickname))
                        .append($('<td>').html(user.name));
                    if (user.company)
                        tr.append($('<td>').html(user.company.name));
                    tr.append($('<td>').html("<button class='btn user-setting'>设置</button><button class='btn user-remove'>删除</button>"));
                    box.append(tr);

                    self.userData[user.id] = user;
                    self.companyData = {id: user.company.id, text: user.company.name};
                });
                pager(data, '#!/account/list', '#page_user');
                $('#select_companies').select2({
                    language: "zh-CN",
                    data: [self.companyData],
                    minimumResultsForSearch: -1,
                    width: '100%',
                    /*ajax: {
                        url: "http://"+cors_config.api_host+"/third/account/companies?token="+window.localStorage.token,
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            return {
                                q: params.term,
                                page: 1
                            };
                        },
                        processResults: function (data) {
                            var data = data.data;
                            return {
                                results: $.map(data.data, function (company) {
                                    return {
                                        text: company.name,
                                        id: company.id
                                    }
                                })
                            };
                        },
                        cache: true
                    },*/
            });
            };
            hooks.beforeSend = function(){
                common.loading.show($("#sec_user"));
            };
            hooks.ajaxComplete = function(){
                $('.add-user').removeClass('disabled');
                common.loading.hide($("#sec_user"));
            };
            userListApi.load(hooks);
        },
        validateUser: function(scene) {
            var form = $('#user-form-new');
            var validator = form.validate({
                lang: 'zh',
                rules: {
                    name :{required:true, minlength:5},
                    nickname: {required:true},
                    password: {required:true, minlength:6},
                    password_again: {required:true, equalTo: "#password"},
                    company_id: {required:true, valueNotEquals: "default" },
                    telephone: {regex:/(^(([0\+]\d{2,3}-)?(0\d{2,3})-)(\d{7,8})(-(\d{3,}))?$)|(^0{0,1}1[3|4|5|6|7|8|9][0-9]{9}$)|(^$)/},
                },
                messages: {
                    password: { required:"请填写成员密码"},
                    company_id: { required:"请指定所属团队", valueNotEquals: "请指定所属团队" },
                    telephone: { regex: "电话号码有误"},
                    password_again: {equalTo: "确认密码输入与密码不符"}
                },
                showErrors: function(errorMap, errorList) {

                    $.each(this.validElements(), function (index, element) {
                        var $element = $(element);

                        $element.data("title", "")
                            .removeClass("error")
                                .addClass('success')
                                    .tooltip("destroy");
                    });

                    $.each(errorList, function (index, error) {
                        var $element = $(error.element).html("");
                        $element.tooltip("destroy") 
                            .data("title", error.message)
                                .removeClass('success')
                                .addClass("error")
                                    .tooltip({'container': 'body','placement': 'right'}); 
                        return false;
                    });
                },
            });
            if (form.valid() == false) {
                validator.focusInvalid();
                return false;
            }
        },
        dispose : function () {

        }
    });
        return widget;
});
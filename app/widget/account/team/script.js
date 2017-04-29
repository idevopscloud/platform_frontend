define(['api', 'common', 'select2', 'jquery.validate', 'validate_localization/messages_zh', 'pages', 'semantic'], function (YM, common) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;
        this.api = new YM();
        this.api.API_LIST({
            user: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/account/users'},
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
                common.loading.show(self.dom);
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
                common.loading.hide(self.dom);
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

            // self.loadUsers(page);
            self.loadCompanies(page);
        },
        bindEvent: function(query) {
            var self = this;
            var page = query.page || 1;

            $('#company-modal-new').on('hidden.bs.modal', function () {
                $('#company-form-new').find('input').val('').removeClass("error success").tooltip("destroy");
            });

            $('.nav-settings').delegate('li', 'click', function(event) {
                event.preventDefault();
                var section = $(this).data('section');
                $(this).siblings().removeClass('active');
                $(this).addClass('active');
                $("#sec_"+section).show().siblings('section').hide();
                // self.loadData(section, 1);
            });

            $('.add-company').on('click', function() {
                $('#company-modal-new').modal('show');
                var form = $('#company-form-new');
                form.find('input[name=contact_user_password]').parents('.form-group').show();
                form.find('input[name=password_again]').parents('.form-group').show();
                $(".reset-pwd").hide();
                $('#company-modal-new #do-new').unbind('click').on('click', function(){
                    if (self.validateCompany('create') == false) {
                        return;
                    }
                    var CompanyAddApi = self.api.API('company', 'add', form.serialize());
                    var hooks = $.extend({}, self.api.loadHooks);
                    hooks.success = function(msg, data) {
                        common.msgs.pop_up("团队创建成功!", 'success');
                        form.find('input').val('').removeClass("error success").tooltip("destroy");
                        self.loadCompanies();
                        $('#company-modal-new').modal('hide');
                    };
                    hooks.beforeSend = function () {
                        common.loading.show($('#company-modal-new>.modal-dialog'));
                    };
                    hooks.ajaxComplete = function() {
                        common.loading.hide($('#company-modal-new>.modal-dialog'));
                        $("#do-new").button("reset");
                    };
                    CompanyAddApi.load(hooks);
                    $("#do-new").button("loading");
                });
            });

            $('#company-box').delegate('.company-setting', 'click', function() {
                var id = $(this).parents('tr').data('id');
                var form = $('#company-form-new');
                var data = self.companyData[id];
                $.each(data, function(key, val) {
                    form.find("input[name='"+key+"']").val(val);
                });
                if (data.envs) {
                    $('#private_res').prop('checked', false).trigger('click');
                }
                $(".reset-pwd").show();
                form.find('input[name=contact_user_password]').parents('.form-group').hide();
                form.find('input[name=password_again]').parents('.form-group').hide();
                $('#company-modal-new').modal('show');
                $('#company-modal-new #do-new').unbind('click').on('click', function(){
                    if (self.validateCompany() == false) {
                        return;
                    } 
                    var companyUpdateApi = self.api.API('company', 'update', form.serialize());
                    companyUpdateApi.apiPath += '/'+id;
                    var hooks = $.extend({}, self.api.loadHooks);
                    hooks.success = function(msg, data) {
                        common.msgs.pop_up("更新团队成功!", 'success');
                        self.loadCompanies(page);
                        $('#company-modal-new').modal('hide');
                    };
                    hooks.beforeSend = function () {
                        common.loading.show($('#company-modal-new>.modal-dialog'));
                    };
                    hooks.ajaxComplete = function() {
                        $("#do-new").button("reset");
                        common.loading.hide($('#company-modal-new>.modal-dialog'));
                    };
                    companyUpdateApi.load(hooks);
                    $("#do-new").button("loading");
                }); 
            });

            $(".reset-pwd").on('click', function(){
                var form = $('#company-modal-new');
                form.find('input[name=contact_user_password]').val("").parents('.form-group').toggle();
                form.find('input[name=password_again]').val("").parents('.form-group').toggle();
            });
            
            $('#company-box').delegate('.company-remove', 'click', function(){
                var id = $(this).parents('tr').data('id');
                $('#modal-confirm .modal-body').html("将删除团队下的所有用户、应用、实例、OS+Lib镜像。确定删除吗？");
                $('#modal-confirm').modal('show');
                $('#modal-confirm #do-action').unbind('click').on('click', function(){
                    
                    var CompanyDestroyApi = self.api.API('company', 'destroy');
                    CompanyDestroyApi.apiPath += '/'+id;
                    var hooks = $.extend({}, self.api.loadHooks);
                    hooks.success = function(msg, data) {
                        $('#modal-confirm').modal('hide');
                        common.msgs.pop_up("删除成功!", 'success');
                        self.loadCompanies(page);
                    };
                    hooks.beforeSend = function () {
                    };
                    hooks.ajaxComplete = function() {
                        $("#do-action").button("reset");
                    };
                    CompanyDestroyApi.load(hooks);
                    $("#do-action").button("loading");
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
                    box.append(tr);

                    self.userData[user.id] = user;
                });
                pager(data, '#!/account/team', '#page_user');
            };
            hooks.beforeSend = function(){
                common.loading.show($("#sec_user"));
            };
            hooks.ajaxComplete = function(){
                common.loading.hide($("#sec_user"));
            };
            userListApi.load(hooks);
        },
        loadCompanies: function(page) {
            var self = this;
            var companyListApi = self.api.API('company', 'list', {page: page});
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                var box = $('#company-box').empty();
                $.each(data.data, function(_, company) {
                    var tr = $('<tr>').data('id', company.id);
                    tr.append($('<td>').html(company.name))
                        .append($('<td>').html(parseInt(company.mem_limit)* 128 +"MB"))
                            .append($('<td>').html((parseInt(company.mem_usage) * 128)+"MB"))
                                .append($('<td>').html(company.contact_user_nickname));
                    tr.append($('<td>').html("<button class='btn company-setting'>设置</button><button class='btn company-remove'>删除</button>"));
                    box.append(tr);

                    self.companyData[company.id] = company;
                });
                pager(data, '#!/account/team', '#page_company');
            };
            hooks.beforeSend = function(){
                common.loading.show($("#sec_company"));
            };
            hooks.ajaxComplete = function(){
                common.loading.hide($("#sec_company"));
            };
            companyListApi.load(hooks);
        },
        validateCompany: function(scene) {
            var form = $('#company-form-new');
            var rules = {
                    name :{required:true},
                    mem_limit: {required:true, min:1},
                    contact_user_nickname: {required:true},
                    contact_user_name: {required:true, minlength:5},
                    contact_user_telephone: {regex:/(^(([0\+]\d{2,3}-)?(0\d{2,3})-)(\d{7,8})(-(\d{3,}))?$)|(^0{0,1}1[3|4|5|6|7|8|9][0-9]{9}$)/},
                    password_again: {required:true, equalTo: "#contact_user_password"},
                    contact_user_password: {required:true, minlength:6},
            };
            
            var validator = form.validate({
                lang: 'zh',
                rules: rules,
                messages: {
                    contact_user_telephone: { regex: "电话号码有误"},
                    password_again: {equalTo: "请再次确认你的密码"}
                },
                showErrors: function(errorMap, errorList) {

                    $.each(this.validElements(), function (index, element) {
                        var $element = $(element);

                        $element.data("title", "")
                            .removeClass("error")
                                .addClass('success')
                                    .tooltip("destroy");
                        /*$element.closest( "form" ).find( "label[for='" + $element.attr( "id" ) + "']" )
                            .addClass("success glyphicon glyphicon-ok-sign")*/
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
            /*if (scene != 'create') {
                $("#password_again").rules('remove');
                $("#password_again").rules('add', {equalTo: "#contact_user_password"});
                $("#contact_user_password").rules('remove');
                $("#contact_user_password").rules('add', {minlength:6});
            } else {
                $("#password_again").rules('add', {required:true, equalTo: "#contact_user_password"});
                $("#contact_user_password").rules('add', {required:true, minlength:6});
            }*/
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
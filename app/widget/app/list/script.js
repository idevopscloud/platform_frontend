define(['api', 'common', 'select2', 'pages', 'directives/apps','jquery.validate', 'validate_localization/messages_zh' ], function (YM, common) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            app: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/app/apps'},
                detail: {type: 'GET', dataType: 'JSON', timeout: 60, url:'third/app/apps', model: 'rest'},
            },
            appInstance : {
                create: {type: 'POST', dataType: 'JSON', timeout: 60, url:'third/app/app/instances', model: 'rest'},
            }
        });

        this.api.loadHooks = {
            beforeSend: function(){
                common.loading.show($("#app-box"));
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
            ajaxFail : function(msg) {
                common.msgs.pop_up(msg, 'error');
            },
            ajaxComplete: function(textStatus){
                common.loading.hide($("#app-box"));
            }
        }
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function (query) {
            window._global = {};
            $('#app-head').hide();

            this.preLoad ();
            this.initAppManager ();
            this.bindEvent ();
        },
        preLoad: function () {
            var self = this;
            // self.getCaaSLists();
            self.getAppLists();
        },
        getAppLists: function() {
            var self = this;
            var appListApi = self.api.API('app', 'list', {action: 'mime'});
            self.api.loadHooks.success = function(msg, data) {
                var app_list_box = $('#app-box').empty();
                if (data.company && data.company.mem_limit) {
                    var usage = parseInt(data.company.mem_usage) * 128 +" / "+ parseInt(data.company.mem_limit) * 128 +"MB";
                    $(".mem-usage").html(usage);
                }
                if (data.apps && data.apps.length > 0) {
                    $.each(data.apps, function(_, app) {
                        var panel = 
                        '<div class="col-lg-4 no-padding box" data-id="'+app.id+'"  data-name="'+app.name+'">\
                            <div class="app-panel">\
                                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">\
                                    <line class="top" x1="0" y1="3" x2="430" y2="3"></line>\
                                    <line class="left" x1="3" y1="300" x2="3" y2="-600"></line>\
                                    <line class="bottom" x1="200" y1="293" x2="-400" y2="293"></line>\
                                    <line class="right" x1="194" y1="-7" x2="194" y2="793"></line>\
                                </svg>\
                                <div class="col-lg-12 no-padding">\
                                    <img class="app-icon" alt="'+app.name+'" src="http://' + cors_config.app_host + '/' + app.icon + '">\
                                </div>\
                                <div class="col-lg-12 text-center">\
                                    <span class="app-title">'+app.name+'</span>\
                                </div>\
                                <div class="col-lg-12 text-center">\
                                    <span>'+app.created_at+'</span>\
                                </div>\
                            </div>\
                        </div>';
                        app_list_box.append(panel);
                    });
                } else {
                    app_list_box.html(self.appendEmpty());
                }
            };
            appListApi.load(self.api.loadHooks);
        },
        getCaaSLists: function() {
            var self = this;

            // caas list
            var caasListApi = self.api.API('caas', 'list', {action: 'mime'});
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                var caas_list_box = $('#caas-box')
                $.each(data, function(_, caas) {
                    var panel = 
                    '<div class="col-lg-4 box" data-id="'+caas.id+'"  data-name="'+caas.name+'">\
                        <div class="caas-panel">\
                            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">\
                                <line class="top" x1="0" y1="0" x2="900" y2="0"/>\
                                <line class="left" x1="0" y1="230" x2="0" y2="-460"/>\
                                <line class="bottom" x1="300" y1="230" x2="-600" y2="230"/>\
                                <line class="right" x1="300" y1="0" x2="300" y2="690"/>\
                            </svg>\
                            <div class="col-lg-7 row">\
                                <img class="caas-icon" alt="'+caas.name+'" src="http://' + cors_config.app_host + '/' + caas.icon + '">\
                            </div>\
                            <div class="col-lg-5">\
                                <div class="caas-name">'+caas.name+'</div>\
                            </div>\
                            <div class="col-lg-12 row">\
                                <div class="caas-update-time"><label>创建于：</label>'+caas.upatedAtText+'</div>\
                            </div>\
                        </div>\
                    </div>';
                    caas_list_box.append(panel);
                });
            };
            caasListApi.load(hooks);

        },
        bindEvent: function () {
            var self = this;
            var app_id;
            $("#app-box").delegate(".box", 'mouseenter mouseleave', function ( event ) {
                if (event.type == 'mouseenter') {
                     $(this).children('.app-btn-group').show({duration:400, easing:'swing'});
                } else if (event.type == 'mouseleave') {
                     $(this).children('.app-btn-group').hide({duration:400, easing:'swing'});
                }
            });

            $('select').select2({minimumResultsForSearch: -1, width: '100%'});
            
            $("#caas-manage").on('click', function(){
                window.location.hash = '#!/app/caas_status';
            });

            $('#app-box').delegate('.env-new', 'click', function(event) {
                event.preventDefault();
                app_id = $(this).parents('.box').data('id');
                $('#env-modal-new').modal('show');
                return false;
            });

            $('#app-box').delegate('.env-clone', 'click', function(event) {
                event.preventDefault();

                var appDetailApi = self.api.API('app', 'detail');
                app_id = $(this).parents('.box').data('id');
                appDetailApi.apiPath += '/' + app_id;
                var hooks = $.extend({}, self.api.loadHooks);
                hooks.success = function(msg, data) {
                    var selector = $("#env-modal-clone #instance_id");
                    selector.empty().select2('data',{id:0, text:"请选择实例"});;
                    if (data.instances && data.instances.length > 0) {
                        $.each(data.instances, function(_,instance){
                            if (instance.env_category != 'product') {
                                selector.append($("<option>").val(instance.id).text(instance.name));
                            }
                        });
                        selector.select2('val', null);
                        $('#env-modal-clone').modal('show');
                    } else {
                        common.msgs.pop_up('抱歉，您目前没有实例可以克隆，请先创建！');
                    }
                };
                appDetailApi.load(hooks);
                
                return false;
            });

            $('#app-box').delegate('.env-export', 'click', function(event) {
                event.preventDefault();
                return false;
                $('#env-modal-export').modal('show');
                return false;
            });

            $('#app-box').delegate('.env-clean', 'click', function(event) {
                event.preventDefault();
                return false;
                $('#env-modal-clean').modal('show');
                return false;
            });

            $('#do-clean').on('click', function(){
                return false;
                $('#modal-confirm .modal-body').html('确定要清除实例？');
                $('#modal-confirm').modal('show');
            });

            $("#env-modal-clone #instance_id").on('select2:select', function() {
                $(this).blur();
                var value = $(this).val();
                if (value) {
                    var env_name = $('option[value='+value+']').html() || "";
                    if (env_name)
                        env_name += '-copy';
                    $("#env-modal-clone #name").val(env_name).focus();
                }
            });

            $.validator.addMethod("regex", function(value, element,params) {
                return (this.optional(element) == true) || params.test(value);
            });

            $("#do-new").on('click', function (event) {
                event.preventDefault();
                
                var form = $("#modal-form-new");
                var params = {};
                var validator = form.validate({
                    lang: 'zh',
                    rules: {
                        name: {
                            required: true,
                            regex:/^[a-z][a-z0-9-]*[a-z0-9]$/,
                            rangelength:[5, 50],
                        }
                    },
                    messages: {
                        name: "允许小写英文字母、数子、-等。以字母或数字开头，且在5~50之间",
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
                
                $.each(form.serializeArray(), function(_, kv) {
                    params[kv.name] = kv.value;
                });
                params.app_id = app_id;
                var appCreateApi = self.api.API('appInstance', 'create', params);
                self.api.loadHooks.success = function(msg, data) {
                    common.msgs.pop_up('实例创建成功', 'success');
                    $('#env-modal-new').modal('hide');
                };
                appCreateApi.load(self.api.loadHooks);
            });

            $("#do-clone").on('click', function (event) {
                event.preventDefault();
                
                var form = $("#env-modal-clone form");
                var validator = form.validate({
                    lang: 'zh',
                    rules: {
                        name: {
                            required: true,
                            regex:/^[a-z][a-z0-9-]*[a-z0-9]$/,
                            rangelength:[5, 50]
                        },
                        'instance_id': {required:true}
                    },
                    messages: {
                        name: "允许小写英文字母、数子、-等。以字母或数字开头，且在5~50之间",
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

                var params = {};
                $.each(form.serializeArray(), function(_, kv) {
                    params[kv.name] = kv.value;
                });
                params.app_id = app_id;
                var appCreateApi = self.api.API('appInstance', 'create', params);
                var hook = $.extend({}, self.api.loadHooks);
                hook.success = function(msg, data) {
                    common.msgs.pop_up('实例克隆成功', 'success');
                    $('#env-modal-clone').modal('hide');
                };
                appCreateApi.load(hook);
            });
        },
        initAppManager: function () {
            $('#app-box').delegate('div.box', 'click', function(){
                window._global.app_id = $(this).data('id');
                window._global.app_name = $(this).data('name');
                window.location.hash = '#!/app/status';
                requirejs('directives/apps').init();
            });
            $('#caas-box').delegate('div.box', 'click', function(){
                window._global.caas_id = $(this).data('id');
                window._global.caas_name = $(this).data('name');
                window.location.hash = '#!/app/caas_status';
            });
        },
        appendEmpty: function() {
            return '<div class="empty-list" style="width: 100%;height: 100%;text-align: left;clear: both;">\
                <img src="app/theme/default/images/list.png">\
                <p>没有查找到相应的结果</p>\
            </div>';
        },
        dispose : function () {
            
        }

    });

    return widget;
});

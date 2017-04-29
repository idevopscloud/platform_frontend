define(['api', 'common', 'directives/apps', 'jquery.ui', 'select2','jquery.validate', 'validate_localization/messages_zh'], function (YM, common, appsManage) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            user: {
                info: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'v1/user/mime'}
            },
            component: {
                create: {type: 'POST', dataType: 'JSON', timeout: 60, url:'third/app/app/components', model: 'rest'},
                update: {type: 'PUT', dataType: 'JSON', timeout: 60, url:'third/app/app/components', model: 'rest'},
                detail: {type: 'GET', dataType: 'JSON', timeout: 60, url:'third/app/app/components', model: 'rest'},
            },
            instance: {
                detail: {type: 'GET', dataType: 'JSON', timeout: 60, url:'third/app/app/instances', model: 'rest'},
            },
            env: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/app/app/envs'},
                detail: {type: 'GET', dataType: 'JSON', timeout: 120, url:'third/app/app/envs', model: 'rest'},
            },
            registries: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/registry/registries'},
            },
        });
        this.api.loadHooks = {
            beforeSend: function(){
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
                        msgs += error+"\n";
                    });
                    msg = msgs;
                }
                common.msgs.pop_up(msg, 'error');
            },
            ajaxFail : function(msg){
                common.msgs.pop_up(msg, 'error');
            },
            ajaxComplete: function(textStatus){
                common.loading.hide(self.dom);
            }
        }
        this.validateParams = {
                    lang: 'zh',
                    errorPlacement: function(error, element) {
                        $( element )
                            .closest( "form" )
                                .find( "label[for='" + element.attr( "id" ) + "']" )
                                    .append( error );
                    },
                    errorElement: "span"
                }
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function (query) {
            var self = this;
            self.free = true;
            self.base_image = null;
            this.preLoad (query);
            this.bindEvent (query);
            if (!self.base_image) {
                $("#use_base_image").trigger('click');
            }
        },
        preLoad: function (query) {
            var self = this;
            var app_id = query.app_id || window._global.app_id || '';
            var instance_id = query.instance_id || window._global.instance_id || '';
            var deploy_id = window._global.deploy_id || '';
            var com_id = query.component_id || window._global.component_id || '';
            var app_nodes = appsManage.getNodes();

            // instance (depends on && app nodes)
            var instanceDetailApi = self.api.API('instance', 'detail', {app_id: app_id,deploy_id:deploy_id});
            if (instanceDetailApi.api.model == 'rest' && instance_id) // restful api
                instanceDetailApi.apiPath += '/'+instance_id;
            instanceDetailApi.options.async = false;
            var instance_hooks = $.extend({},self.api.loadHooks);
            instance_hooks.success = function (msg, data) {
                var selector = $('.depend-component');
                $.each(data.components, function(_, component){
                    if (component.id != com_id) {
                        var definition = JSON.parse(component.definition);
                        var depends_on = [];
                        $.each(definition, function (rc_or_svc, com) {
                            var depends = [],mem = '',replicas = '',version = '';
                            if (rc_or_svc.search('-rc') > 0) {
                                $.each(com.depends_on, function(_, depend){
                                    depends_on.push( depend.substr(0,depend.lastIndexOf('-')) );
                                });
                            }
                        });
                        selector.append(
                            $("<option>")
                                .val(component.name)
                                    .text(component.name)
                                        .data('depends_on', depends_on)
                        );
                    }
                })
                $.each(app_nodes, function(_, node) {
                    if (data.node_group_id == node.group_id) {
                        $('.rc-node-bind').append($('<option>').val(node.ipaddress).text(node.ipaddress));
                        $('.service-node-bind').append($('<option>').val(node.ipaddress).text(node.ipaddress));
                    }
                });
                self.env_category = data.env_category;
            };
            instance_hooks.beforeSend = function() {
            };
            instanceDetailApi.load(instance_hooks);

            // get env sections
            var envListApi = self.api.API('env', 'list');
            var hooks = $.extend({},self.api.loadHooks);
            hooks.success = function(msg, data) {
                self.free = data.free;
            }
            hooks.beforeSend= function(){};
            envListApi.options.async = false;
            envListApi.load(hooks);

            var componentDetailApi = self.api.API('component', 'detail', {app_id: app_id, instance_id: instance_id, deploy_id:deploy_id});
            if (componentDetailApi.api.model == 'rest' && com_id) // restful api
                componentDetailApi.apiPath += '/'+com_id;
            var comHooks = $.extend({}, self.api.loadHooks);
            var form = $('#form-new');
            comHooks.success = function (msg, data) {
                $.each(data, function(section, item){
                    if (!item)
                        return;
                    $("#switcher").hide();
                    if (section == 'container') {
                        $('input[name="container[image]"]').val(item['image']);
                        $('input[name="container[name]"]').val(item['name']);
                        $('input[name="container[version]"]').val(item['version']);
                        $('input[name="container[memory_max]"]').val(item['memory_max']);
                        $('input[name="container[memory_min]"]').val(item['memory_min']);
                        $('input[name="container[replicas]"]').val(item['replicas']);
                        if (item['env'] && item['env']['variable']) {
                            $.each(item['env']['variable'], function(_, config){
                                $.each(config, function(key, val){
                                    $('.env-variable-box').append($('<tr>').attr('data-key', key).append($('<td>').html(key)).append($('<td>').html(val)));
                                    form.append($('<input type="hidden">').attr('name',"container[env][variable][]["+key+"]").val(val));
                                });
                            });
                        }
                        $('input[name="container[version]"]').val(item['version']);
                        $('input[name="container[version]"]').val(item['version']);
                        if (com_id) {
                            $('input[name="container[name]"]').prop('readonly', true);
                        }
                        if (self.env_category == 'product') {
                            $('input[name="container[image]"]').prop('readonly', true);
                            $('input[name="container[name]"]').prop('readonly', true);
                            $('input[name="container[version]"]').prop('readonly', true);
                            $('input[name="git[addr]"]').prop('readonly', true);
                            $('select[name="base_image"]').prop('disabled',true);
                            $('input[name="git[tag]"]').prop('readonly', true);
                            $('input[name="build_path"]').prop('readonly', true);
                            $('input[name="start_path').prop('readonly', true);
                        }
                    } else if (section == 'config') {
                        $.each(item,function(sub_section, sub_item) {
                            if (sub_section == 'volume') {
                                $.each(sub_item, function(_, volume) {
                                    $.each(volume, function(name, path) {
                                        path = path.split(':');
                                        var host_path = path[0];
                                        var mount_path = path[1];
                                        var volume = "<div class='col-lg-3 text-center volume-item' data-volume='"+name+"' >\
                                                        <div class='col-lg-12'><label>"+name+"</label></div>\
                                                        <img src='app/theme/default/svg/apps/volume.svg'\
                                                         role='button' data-toggle='popover' data-trigger='click' data-placement='right' title='卷:"+name+"' \
                                                         data-content='<label>挂载路径:</label>"+mount_path+"<br><label>主机路径:</label>"+host_path+"' />\
                                                        <span class='glyphicon glyphicon-trash'></span>\
                                                    </div>";
                                        $('.volume-bind').append(volume);
                                        $('.volume-item img').popover({html:true});

                                        form.append(
                                            $('<input type="hidden">').attr('data-volume-name', name)
                                                .attr('name',"config[volume][]["+name+"]")
                                                .val(host_path+":"+mount_path)
                                        );
                                    });
                                });
                                return;
                            }
                            if (self.free) {
                                if (sub_item['nodes']) {
                                    var box = $('.svc-ip-settings').find('.client-public');
                                    $.each(sub_item['nodes'], function(_,ipaddress) {
                                        box.empty().append($('<p>').html(ipaddress));
                                        return;
                                    });
                                }
                                if (sub_item['port'] ) {
                                    $.each(sub_item['port'], function(_,port) {
                                        $.each(port, function(net, port_protocol) {
                                            net = net.split(':');
                                            $('#service-port-container').val(net[0]);
                                            return;
                                        });
                                        return;
                                    });
                                }
                            } else {
                                if (sub_item['nodes']) {
                                    $.each(sub_item['nodes'], function(_,ipaddress) {
                                        var box = $('.'+sub_section+'-node-box');
                                        var tr = $('<tr>').append($('<td>').html(ipaddress));
                                        box.append(tr);
                                        form.append(
                                        $('<input type="hidden">').attr('data-'+sub_section+'-node', ipaddress)
                                            .attr('name',"config["+sub_section+"][nodes][]")
                                            .val(ipaddress)
                                        );
                                    });
                                }
                                if (sub_item['port']) {
                                    $.each(sub_item['port'], function(_,port) {
                                        $.each(port, function(net, port_protocol) {
                                            net = net.split(':');
                                            var port_container = net[0];
                                            var port_host = net[1];
                                            if (port_container && port_host && port_protocol) {
                                                var input = $('input[data-'+section+'-port-host="'+port_host+'"]');
                                                $('.'+sub_section+'-port-box').append(
                                                    $('<tr>').append($('<td>').html(port_container))
                                                        .append($('<td>').html(port_host))
                                                        .append($('<td>').html(port_protocol))
                                                );
                                                form.append(
                                                    $('<input type="hidden">').attr('data-'+sub_section+'-port-host', port_host)
                                                        .attr('name',"config["+sub_section+"][port][]["+port_container+":"+port_host+"]")
                                                        .val(port_protocol)
                                                );
                                            }
                                        });
                                    });
                                }
                            }
                        })
                    } else if (section == 'depends') {
                        $.each(item, function(_, component) {
                            var op_panel = '';
                            if (self.env_category !== 'product') {
                                op_panel = "<span class='glyphicon glyphicon-trash'></span>";
                            }
                            var com_item = 
                                    "<div class='col-lg-3 depend-item' data-component='"+component+"'>\
                                        <img src='app/theme/default/svg/apps/share-point.svg' data-toggle='tooltip' data-trigger='hover' data-placement='top' title='"+component+"'/>\
                                        "+op_panel+"\
                                    </div>";
                            $('.depend-bind').append(com_item);
                            $('.depend-item img').tooltip();
                            form.append(
                                $('<input type="hidden">')
                                    .attr('data-component', component)
                                    .attr('name',"depends["+component+"]")
                                    .val(component)
                            );
                        });
                    } else if (section == 'hook') {
                        $.each(item, function(hook, sub_item) {
                            if (!sub_item)
                                return;
                            $.each(sub_item, function(type,script){
                                if (!script)
                                    return;
                                var op_panel = '';
                                if (self.env_category !== 'product') {
                                    op_panel = "<span class='glyphicon glyphicon-trash'></span>\
                                                <span class='glyphicon glyphicon-ok'></span>";
                                }
                                var item = "<div class='col-lg-3 script-item' data-hook='"+hook+"' data-type='"+type+"'>\
                                                <img src='app/theme/default/svg/apps/"+type+"-coding.svg' data-toggle='tooltip' data-trigger='hover' data-placement='top' title='"+script+"' />\
                                                "+op_panel+"\
                                            </div>";
                                var hook_box =  $('fieldset.'+hook);
                                $('fieldset.'+hook).append(item);
                                $('.script-item img').tooltip();
                                form.append(
                                    $('<input type="hidden">')
                                        .attr('name',"hook["+hook+"]["+type+"]")
                                        .val(script)
                                );
                            });
                        });
                    } else if (section == 'monitor') {
                        $('input[name="monitor"]').val(item);
                    } else if (section == 'log') {

                    } else if (section == 'build') {
                        if (item && item.base_image) {
                            self.base_image = item.base_image;
                            $("#git-addr").val(item.git.addr).prop('readonly', true);;
                            $("#git-tag").val(item.git.tag);
                            $("#build-path").val(item.build_path);
                            $("#start-path").val(item.start_path);
                        }
                    }
                });
            };
            if (com_id) {
                componentDetailApi.options.async = false;
                componentDetailApi.load(comHooks);
            }

            // get company id as namespace then got base image lists
            self.getRegistry();
            self.getUserInfo();
        },
        bindEvent: function (query) {
            var self = this;
            var app_id = query.app_id || window._global.app_id || '';
            var instance_id = query.instance_id || window._global.instance_id || '';
            var deploy_id = window._global.deploy_id || '';
            var com_id = query.component_id || window._global.component_id || '';
            $('#app-head .panel-default').hide();
            var form = $('#form-new');
            if (self.free) {
                $('.client-private').remove();
            } else {
                $('.client-public').remove();
            }
            $.validator.addMethod("regex", function(value, element,params) {
                return (this.optional(element) == true) || params.test(value);
            });
            $.validator.addMethod("greaterThanOrEqualTo", function(value, element, params) {    
                /*if (!/Invalid|NaN/.test(new Date(value))) {
                    return new Date(value) >= new Date($(params[0]).val());
                }*/    
                return isNaN(value) && isNaN($(params[0]).val()) || (Number(value) >= Number($(params[0]).val())); 
            },'必须大于等于{1}');
            var validate_rules = {
                'container[name]': {
                    required: true,
                    regex:/^[a-z][a-z0-9-]*[a-z0-9]$/,
                    rangelength:[3, 50],
                },
                'container[memory_min]': {required:true, digits:true, min:1},
                'container[memory_max]': {required:true, digits:true, min:1, greaterThanOrEqualTo: ["#memory_min", "最小保证"]},
                'git[version]' : {required:true, regex:/^[\w][\w.-]{0,127}$/},
                'git[auth]' : {required:true},
                'git[addr]' : {required:true, regex:/^[\w][\w.\-:\/@]*$/},
                'git[tag]' : {required:true, regex:/^[\w][\w.-]{0,127}$/},
                'start_path' : {required:true}
            };

            $('#rc-port-container, #rc-port-host, #service-port-container, #service-port-host').blur(function(){
                $(this).validate(self.validateParams);
                $(this).valid();
            });

            $('select').select2({ minimumResultsForSearch: -1, width: '100%'});

            // sidebar scroll
            $('body').scrollspy({ target: '.bs-docs-sidebar', offset: 200});

            // sidebar click
            $("#component-navbar a").on('click', function(event){
                event.preventDefault();

                var hash = this.hash;
                $('html, body').animate({
                    scrollTop: $(hash).offset().top - 150
                }, 500, 'easeInOutBack', function(){
                    //window.location.hash = hash;
                });
            });

            $('.do-cancel').on('click', function(event){
                event.preventDefault();
                window.location.hash = '#!/app/deploy';
            });

            $('.do-save').on('click', function(event){
                event.preventDefault();
                var validator = form.validate({
                    lang: 'zh',
                    rules: validate_rules,
                    messages: {
                        'container[name]': "允许小写英文字母、数字和中划线。以字母开头，字母或者数字结尾，且长度在3~50之间",
                        'container[version]': "允许小写英文字母、数字、点号和横线。以字母或者数字开头，不超过128个字符",
                        'container[image]': "允许英文字母、数字、点号、冒号、反斜线、@和横线",
                        'git[tag]': "允许小写英文字母、数字、点号和横线。以字母或者数字开头，不超过128个字符",
                        'git[addr]': "允许英文字母、数字、点号、冒号、反斜线、@和横线"
                    },
                    errorPlacement: function(error, element) {
                        $( element )
                            .closest( "form" )
                                .find( "label[for='" + element.attr( "id" ) + "']" )
                                    .append( error );
                    },
                    errorElement: "span"
                });
                if (self.free == false) {
                    var exists = null;
                    $('input[name="config[service][nodes][]"]').each(function(){
                        var val = $(this).val();
                        exists = 0 != $('.service-node-bind option[value="'+val+'"]').length;
                        if (!exists) {
                            return false;
                        }
                    });
                    if (exists === false) {
                        common.msgs.pop_up('服务配置错误：绑定了错误的IP', 'error');
                        return false;
                    }
                }
                if (validator.form() == false) {
                    /*validator.focusInvalid();*/
                    $('html, body').animate({
                        scrollTop: $(validator.errorList[0].element).offset().top - 150
                    }, 500);
                    return false;
                }

                var params = {};
                $('select[name="base_image"]').prop('disabled', false);
                $.each(form.serializeArray(), function(_, kv) {
                    params[kv.name] = kv.value;
                });
                if (self.env_category == 'product') {
                    $('select[name="base_image"]').prop('disabled', true);
                }
                if (com_id) {
                    var compnentUpdateApi = self.api.API('component', 'update', params);
                    compnentUpdateApi.apiPath += '/'+com_id;
                    compnentUpdateApi.params.app_id = app_id; 
                    compnentUpdateApi.params.instance_id = instance_id;
                    compnentUpdateApi.params.deploy_id = deploy_id;
                    var com_hooks = $.extend({}, self.api.loadHooks);
                    com_hooks.success = function (msg, data) {
                        common.msgs.pop_up("更新完成！", 'success');
                        if (data && data.deploy && data.deploy.id) {
                            window._global.deploy_id = data.deploy.id;
                        }
                        setTimeout(function() {
                            window.location.hash = '#!/app/deploy';
                        }, 1000);
                    };
                    compnentUpdateApi.load(com_hooks);
                } else {
                    var compnentCreateApi = self.api.API('component', 'create', params);
                    compnentCreateApi.params.app_id = app_id; 
                    compnentCreateApi.params.instance_id = instance_id;
                    compnentCreateApi.params.deploy_id = deploy_id;
                    var com_hooks = $.extend({}, self.api.loadHooks);
                    com_hooks.success = function (msg, data) {
                        common.msgs.pop_up("创建成功！", 'success');
                        if (data && data.deploy && data.deploy.id) {
                            window._global.deploy_id = data.deploy.id;
                        }
                        setTimeout(function() {
                            window.location.hash = '#!/app/deploy';
                        }, 1000)
                    };
                    compnentCreateApi.load(com_hooks);
                }
            });

            // switch on/off image repo or git build
            $("#use_base_image").on('change', function(){
                if(this.checked) {
                    $('.build-panel').fadeOut(function() {
                        $('.image-panel').fadeIn();
                        validate_rules['container[version]'] = {required:true, regex:/^[\w][\w.-]{0,127}$/};
                        validate_rules['container[image]'] = {required:true, regex:/^[\w][\w.\-:\/@]*$/};
                    });
                } else {
                    $('.image-panel').fadeOut(function(){
                        $('.build-panel').fadeIn();
                        validate_rules['base_image'] = {required:true};
                        validate_rules['git[tag]'] = {required:true, regex:/^[\w][\w.-]{0,127}$/};
                        validate_rules['git[auth]'] = {required:true};
                        validate_rules['git[addr]'] = {required:true, regex:/^[\w][\w.\-:\/@]*$/};
                        validate_rules['start_path'] = {required:true};
                    });
                }
                
            });

            // env variable settings
            $('.env-settings-save').on('click', function (event) {
                event.preventDefault();
                var key = $('.env-key').val();
                var val = $('.env-value').val();
                if ($('.env-variable-box tr[data-key="'+key+'"').length > 0) {
                    common.msgs.pop_up('变量已存在！', 'error');
                    return;
                }
                if (key && val) {
                    $('.env-variable-box')
                        .append($('<tr>').attr('data-key', key).append($('<td>').html(key)).append($('<td>').html(val)));
                    $('.env-key').val('');
                    $('.env-value').val('');
                    form.append($('<input type="hidden">').attr('name',"container[env][variable][]["+key+"]").val(val));
                }
                
            });

            $('.env-settings-remove').on('click', function (event) {
                event.preventDefault();
                $('.env-variable-box tr.active').each(function() {
                    var key = $(this).children('td').first().html();
                    var input_key = "container[env][variable][]["+key+"]";
                    var input = $('input[name="'+input_key+'"]');
                    if (input)
                        input.remove();
                    $(this).remove();
                })
            });

            $('.env-variable-box').delegate('tr', 'click', function () {
                if($(this).hasClass('active')) {
                    $(this).removeClass('active');
                } else {
                    $(this).addClass('active');
                }
                
            });

            // rc & service 
            var sections = ['rc', 'service'];
            $.each(sections, function(_, section) {

                // port settings
                $('.'+section+'-port-save').on('click', function (event) {
                    event.preventDefault();
                    if ($('.'+section+'-port-box').find('tr').length >= 1) {
                        common.msgs.pop_up('目前不支持多个端口映射', 'error');
                        return false;
                    }
                    $('.'+section+'-port-host').validate(self.validateParams);
                    $('.'+section+'-port-container').validate(self.validateParams);
                    if ($('.'+section+'-port-host').valid() == false || $('.'+section+'-port-container').valid() == false) {
                        return false;
                    }

                    var port_container = $('.'+section+'-port-container').val();
                    var port_host = $('.'+section+'-port-host').val();
                    var port_protocol = $('.'+section+'-port-protocol').val();
                    if (port_container && port_host && port_protocol) {
                        var input = $('input[data-'+section+'-port-host="'+port_host+'"]');
                        if (input && input.length > 0) {
                            common.msgs.pop_up('目标端口不可重复', 'error');
                            return false;
                        }
                        $('.'+section+'-port-box').append(
                            $('<tr>').append($('<td>').html(port_container))
                                .append($('<td>').html(port_host))
                                .append($('<td>').html(port_protocol))
                            );
                        $('.'+section+'-port-container').val('');
                        $('.'+section+'-port-host').val('');
                        form.append(
                            $('<input type="hidden">').attr('data-'+section+'-port-host', port_host)
                                .attr('name',"config["+section+"][port][]["+port_container+":"+port_host+"]")
                                .val(port_protocol)
                        );
                    }
                });

                $('.'+section+'-port-remove').on('click', function (event) {
                    event.preventDefault();
                    $('.'+section+'-port-box tr.active').each(function() {
                        var port_container = $(this).children('td:nth-child(1)').html();
                        var port_host = $(this).children('td:nth-child(2)').html();
                        var key = port_container + ":" + port_host;
                        var input_key = "config["+section+"][port][]["+key+"]";
                        var input = $('input[name="'+input_key+'"]');
                        if (input)
                            input.remove();
                        $(this).remove();
                    })
                });


                $('.'+section+'-port-box').delegate('tr', 'click', function () {
                    if ($(this).hasClass('active'))
                        $(this).removeClass('active');
                    else
                        $(this).addClass('active');
                });

                // node settings
                $('.'+section+'-node-bind-save').on('click', function(event) {
                    event.preventDefault();
                    var node = $('.'+section+'-node-bind').val();
                    var box = $('.'+section+'-node-box');

                    if (box.find('tr td').length >= 1) {
                        common.msgs.pop_up('目前不支持多个IP绑定', 'error');
                        return false;
                    }
                    // $.each(nodes, function(_, node) {
                        var tr = $('<tr>').append($('<td>').html(node));
                        box.append(tr);
                        form.append(
                            $('<input type="hidden">')
                                .attr('data-'+section+'-node',  node)
                                    .attr('name',"config["+section+"][nodes][]")
                                        .val(node)
                        );
                    // });
                    // $('.'+section+'-node-bind').select2('val', null);
                })

                $('.'+section+'-node-bind-remove').on('click', function(event) {
                    event.preventDefault();
                    var nodes = [];
                    $('.'+section+'-node-box td.active').each(function() {
                        var node = $(this).html();
                        var input = $('input[data-'+section+'-node="'+node+'"]');
                        if (input)
                            input.remove();
                        $(this).remove();
                    })
                })

                $('.'+section+'-node-box').delegate('td', 'click', function () {
                    if ($(this).hasClass('active'))
                        $(this).removeClass('active');
                    else
                        $(this).addClass('active');
                })
            });

            // volume settings
            $('.volume-bind-add').on('click', function (event) {
                event.preventDefault();
                $('#volume-modal-add').modal('show');
            }).tooltip();

            $("#do-volume-save").on('click', function(event) {
                event.preventDefault();
                var modal_form  = $('#modal-form-add');
                var validator = modal_form.validate({
                    lang: 'zh',
                    rules: {
                        name: {required: true, regex:/^[a-z][a-z0-9-]*[a-z0-9]$/},
                        host_path: {required: true, regex:new RegExp("^(/[^/ ]*)+/?$")},
                        mount_path: {required: true, regex:new RegExp("^(/[^/ ]*)+/?$")}
                    },
                    messages: {
                        'name': "允许小写英文字母、数字和中划线。以字母开头，字母或者数字结尾",
                        'host_path': "非法路径",
                        'mount_path': "非法路径",
                    },
                    errorPlacement: function(error, element) {
                        $( element )
                            .closest( "form" )
                                .find( "label[for='" + element.attr( "id" ) + "']" )
                                    .append( error );
                    },
                    errorElement: "span"
                });

                if (modal_form.valid() == false) {
                    validator.focusInvalid();
                    return false;
                }
                
                var name = $('#modal-form-add input[name=name]').val();
                var host_path = $('#modal-form-add input[name=host_path]').val();
                var mount_path = $('#modal-form-add input[name=mount_path]').val();
                var volume = "<div class='col-lg-3 text-center volume-item' data-volume='"+name+"' >\
                                <div class='col-lg-12'><label>"+name+"</label></div>\
                                <img src='app/theme/default/svg/apps/volume.svg'\
                                 role='button' data-toggle='popover' data-trigger='click' data-placement='right' title='卷:"+name+"' \
                                 data-content='<label>挂载路径:</label>"+mount_path+"<br><label>主机路径:</label>"+host_path+"' />\
                                <span class='glyphicon glyphicon-trash'></span>\
                            </div>";
                form.append(
                    $('<input type="hidden">').attr('data-volume-name', name)
                        .attr('name',"config[volume][]["+name+"]")
                        .val(host_path+":"+mount_path)
                );

                $('.volume-bind').append(volume);
                $('.volume-item img').popover({html:true});
                $('#volume-modal-add').modal('hide');
            });

            $('.volume-bind').delegate('.glyphicon-trash', 'click', function (event) {
                event.preventDefault();
               
                var item = $(this).parent();
                var volume = item.data('volume');
                var input = $('input[data-volume-name="'+volume+'"]');
                if (input)
                    input.remove();
                 item.remove();
            });

            // depend on
            if (self.env_category !== 'product') {
                $('.depend-bind-add').show();
                $('.depend-bind-add').on('click', function(event) {
                    event.preventDefault();
                    $('#depend-modal-add').modal('show');
                }).tooltip();
            } else {
                $('.depend-bind-add').hide();
            }

            $('.depend-component').on('select2:select', function() {
                var container_name = $('input[name="container[name]"]').val();
                var component = $(this).val();
                
                var depend_depends = $(this).find('option[value="'+component+'"]').data('depends_on') || '';
                if ( depend_depends.indexOf(container_name) >= 0 ) {
                        common.msgs.pop_up("存在互相依赖，请选择别的组件！");
                        $(this).select2('val', null);
                        return;
                }

                if ( container_name == component ) {
                    common.msgs.pop_up("不可依赖自身，请选择别的组件！");
                    $(this).select2('val', null);
                    return;
                }
            })
            
            $('#do-depend-save').on('click', function(event) {
                event.preventDefault();
                var component = $('.depend-component').val();
                if (!component) {
                    common.msgs.pop_up("请选择组件！");
                    return false;
                }

                var flag = true;
                $('input[name^="depends["]').each(function() {
                    if ($(this).val() == component) {
                        common.msgs.pop_up("依赖已存在，请选择别的组件！");
                        $(this).select2('val', null);
                        flag = false;
                        return;
                    }
                });
                if (!flag)
                    return;

                var item = "<div class='col-lg-3 depend-item' data-component='"+component+"'>\
                                <img src='app/theme/default/svg/apps/share-point.svg' data-toggle='tooltip' data-trigger='hover' data-placement='top' title='"+component+"' />\
                                <span class='glyphicon glyphicon-trash'></span>\
                        </div>";
                $('.depend-bind').append(item);
                $('.depend-item img').tooltip();
                form.append(
                    $('<input type="hidden">')
                        .attr('data-component', component)
                        .attr('name',"depends["+component+"]")
                        .val(component)
                );
                
                $('#depend-modal-add').modal('hide');
            });
            

            $('.depend-bind').delegate('.glyphicon-trash', 'click', function (event) {
                event.preventDefault();
               
                var item = $(this).parent();
                var component = item.data('component');
                var input = $('input[data-component="'+component+'"]');
                if (input)
                    input.remove();
                 item.remove();
            });

            // script availiable
            $('.script-type').on('change', function() {
                $('.script-name').attr('placeholder', '请输入URL地址，端口范围1~65535！');
            })
            $('.script-bind').delegate('.glyphicon-trash', 'click', function (event) {
                event.preventDefault();
               
                var item = $(this).parent();
                var hook = item.data('hook');
                var type = item.data('type');
                var input_key = "hook["+hook+"]["+type+"]";
                var input = $('input[name="'+input_key+'"]');
                if (input)
                    input.remove();
                 item.remove();
            });

            $('.do-script-save').on('click', function(event) {
                event.preventDefault();
                var type = $('.script-type').val();
                var script = $('.script-name').val();
                if (!script) {
                    common.msgs.pop_up('请填写执行文件！', 'error');
                    return false;
                }
                if (type == 'httpget') {
                    var link = document.createElement('a');
                    link.setAttribute('href', script);
                    if (link.port != '' && (link.port > 65535 || link.port < 1)) {
                        common.msgs.pop_up('端口需为1~65535之间！', 'error');
                        return false;
                    }
                }

                var hook = $('.script-hook').val();
                var item = "<div class='col-lg-3 script-item' data-hook='"+hook+"' data-type='"+type+"'>\
                                <img src='app/theme/default/svg/apps/"+type+"-coding.svg' data-toggle='tooltip' data-trigger='hover' data-placement='top' title='"+script+"' />\
                                <span class='glyphicon glyphicon-trash'></span>\
                                <span class='glyphicon glyphicon-ok'></span>\
                            </div>";
                var hook_box =  $('fieldset.'+hook);
                if ( hook_box.find('.script-item').length > 0) {
                    common.msgs.pop_up('请勿重复添加！', 'error');
                    return false;
                } else {
                    $('fieldset.'+hook).append(item);
                    $('.script-item img').tooltip();
                    form.append(
                        $('<input type="hidden">')
                            .attr('name',"hook["+hook+"]["+type+"]")
                            .val(script)
                    );
                }
            })

        },
        getUserInfo: function() {
            var self = this;
            var userInfoApi = self.api.API('user', 'info');
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.beforeSend = function(){
            };
            hooks.success = function(msg, data) {
                self.getBaseImage(self.registry_id, data.company_id, self.base_image);
            }
            userInfoApi.load(hooks);
        },
        getRegistry: function() {
            var self = this;
            var registryListApi = self.api.API('registries', 'list', {name: 'platform'});
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                if (data.id) {
                    self.registry_id = data.id;
                }
            };
            registryListApi.options.async = false;
            registryListApi.load(hooks);
        },
        getBaseImage: function(registry_id, company_id, base_image) {
            var self = this;
            var app_name = company_id; // change namespace from app_name to company id. 2016-10-10
            var imgListApi = self.api.API('registries', 'list',  {action: 'images', type: 'app_base', app_name: app_name});
            imgListApi.apiPath += '/'+registry_id;
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.beforeSend = function(){};
            hooks.success = function(msg, data) {
                var img_sel = $(".base-image");
                var first = null;
                img_sel.empty().select2('data',{});
                if (data.images && data.images.length > 0) {
                    $.each(data.images, function(n, img) {
                        if (!first) {
                            first = img.name;
                        }
                        $.each(img.tags, function (_, tag) {
                            img_sel.append($("<option>").val(img.name+":"+tag.name).text(img.short_name+":"+tag.name));
                        });
                    }); 
                    if (base_image) {
                        first = base_image;
                    }
                    img_sel.select2('val', first);
                    img_sel.val(first).trigger('select2:select');
                }
            };
            imgListApi.load(hooks);
        },
        dispose: function(){

        }
    });

    return widget;
});

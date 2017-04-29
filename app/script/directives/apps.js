define(['api', 'common', 'select2', 'select2.lang.zh', 'jquery.validate', 'validate_localization/messages_zh'], function(YM, common) {
    'use strict';

    var self = {};
    self.api = new YM();
    self.api.API_LIST({
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
        },
        appInstance: {
            create: {
                type: 'POST',
                dataType: 'JSON',
                timeout: 60,
                url: 'third/app/app/instances',
                model: 'rest'
            },
        }
    });

    self.api.loadHooks = {
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
    };

    self.envs = [];
    self.node_groups = [];
    self.nodes = [];

    self.init = function() {
        $('.app-name').empty().append($("<a>").attr('href', '#!/app/status').html(window._global.app_name));
        $(".env-category").select2({
            minimumResultsForSearch: -1,
            width: '100%',
            language: "zh-CN"
        });
        $(".env-name").select2({
            minimumResultsForSearch: -1,
            width: '100%',
            placeholder: "请选择环境"
        });
        $('select[name=clone-app-instance]').select2({
            minimumResultsForSearch: -1,
            width: '100%',
            language: "zh-CN"
        });
        if (window.location.hash != '#!/app/list') {
            self.load();
            $('#app-head').show();
            $("#sel-node-group").unbind('select2:select').on('select2:select', function() {
                var ng = $(this).val();
                delete window._global.deploy_id;
                self.load(ng);
                if (window.location.hash.search('_r=') < 0)
                    window.location.hash += '?_r=' + (new Date).getTime();
                else
                    window.location.hash = window.location.hash.replace(/(_r=)(.*)/, "$1" + (new Date).getTime());
            });

            // forbidden refresh
            window.onbeforeunload = function() {
                return "";
            }
        } else {
            $('#app-head').hide();
        }
    }

    self.fill_instance = function() {
        $(".env-name").empty().select2('data', {});
        if (self.envs.length > 0) {
            var first = null;
            $.each(self.envs, function(_, n) {
                if (!first) {
                    first = n.id;
                }
                var option = $('<option>').val(n.id).html(n.name);
                $(".env-name").append(option);
            });
            $(".env-name").select2('val', first);
            $(".env-name").val(first).trigger('select2:select');
        }

    }

    self.load = function(node_group) {

        var app_id = window._global.app_id || '';
        if (!app_id)
            window.location.href = '/app.html#!/app/list';
        var params = {
            node_group: node_group
        };
        var appdetailApi = self.api.API('app', 'detail', params);
        if (appdetailApi.api.model == 'rest' && app_id) // restful api
            appdetailApi.apiPath += '/' + app_id;

        self.api.loadHooks.success = function(msg, data) {
            if (data && data.node_groups) {
                self.node_groups = data.node_groups;
                $('#sel-node-group').empty();
                self.nodes = {};
                $.each(data.node_groups, function(_,ng) {
                    if (ng.nodes) {
                        $.each(ng.nodes, function(_, node){
                            self.nodes[node.ipaddress] = node;
                        });
                    }
                        // self.nodes = self.nodes.concat(ng.nodes);
                    else
                        self.nodes = [];

                    if (!node_group) {
                        node_group = ng.id;
                    }
                    $('#sel-node-group').append(
                        $('<option>')
                            .val(ng.id)
                                .text(ng.name)
                                    .data({registry_id: ng.cluster.registry_id, env_category: ng.env_category})
                    );
                });
                $('#sel-node-group').select2({
                    minimumResultsForSearch: -1,
                    width: '100%',
                    language: "zh-CN"
                }).select2('val', node_group);
                window._global.registry_id = $('#sel-node-group').find('option[value="'+node_group+'"]').data('registry_id');
                window._global.env_category = $('#sel-node-group').find('option[value="'+node_group+'"]').data('env_category');
            } else {
                self.node_groups = [];
            }

            if (data && data.instances && data.instances.length > 0) {
                if (node_group) {
                    self.envs = [];
                    $.each(data.instances, function(_, ins){
                        if (ins.node_group_id == node_group) {
                            self.envs.push(ins);
                        }
                    })
                }
                
            } else {
                self.envs = [];
                /*if (env_category == 'product') {
                    $('#product-modal-confirm').modal('show');
                    $('#product-modal-confirm #back').unbind('click').on('click', function() {
                        $('#product-modal-confirm').modal('hide');
                    });
                }*/
            }
            self.fill_instance();

            /*if (data.registry_id) {
                window._global.registry_id = data.registry_id;
            }*/
        };

        appdetailApi.options.async = false;
        appdetailApi.load(self.api.loadHooks);
    };

    self.getNodes = function() {
        return self.nodes;
    }

    self.getNodeGroups = function() {
        return self.node_groups;
    }

    $("#btn-clone").on('click', function() {
        self.load('develop');
        var clone_select = $('select[name=clone-app-instance]');
        clone_select.empty().select2('data', {
            id: 0,
            text: "请选择环境"
        });
        $('.new-app-instance').val("");
        if (self.envs.length > 0) {
            $.each(self.envs, function(_, n) {
                var option = $('<option>').val(n.id).html(n.name);
                clone_select.append(option);
            });
            clone_select.select2('val', null);
        }
        clone_select.unbind('select2:select').on('select2:select', function() {
            var value = $(this).val();
            var old_name = $('option[value=' + value + ']').html() || "new";
            $(".new-app-instance").val(old_name + '-pro').focus();
        });
        $('#modal-confirm').modal('hide');
        $('.to-instance').html('To:生产实例');
        // $('#do-pro-clone').data('env-category', 'product');
        $("#app-instance-clone-modal").modal('show');

    });

    // clone instance for product
    $('#do-pro-clone').on('click', function(event) {
        var instance_id = $('select[name=clone-app-instance]').val();
        var name = $('.new-app-instance').val();
        var env_category = $(this).data('env-category') || 'product';
        var form = $('#modal-form-clone');

        $.validator.addMethod("regex", function(value, element, params) {
            return (this.optional(element) == true) || params.test(value);
        });
        form.validate({
            lang: 'zh',
            rules: {
                name: {
                    required: true,
                    regex: /^[a-z][a-z0-9-]*[a-z0-9]$/,
                    rangelength: [5, 50]
                },
                "clone-app-instance": {
                    required: true
                },
            },
            messages: {
                name: "允许小写英文字母、数子、-等。以字母开头，且在5~50之间",
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
        var params = {
            // env_category: env_category,
            instance_id: instance_id,
            name: name,
            app_id: window._global.app_id,
            node_group: $('#sel-node-group').val(),
        };
        var appdetailApi = self.api.API('appInstance', 'create', params);
        var hook = $.extend({}, self.api.loadHooks);
        hook.success = function(msg, data) {
            common.msgs.pop_up('创建完成', 'success');
            $('.modal').modal('hide');
            self.load($('#sel-node-group').val());
        };
        hook.beforeSend = function() {
            common.loading.show($("#app-instance-clone-modal"));
        };
        hook.ajaxComplete = function() {
            common.loading.hide($("#app-instance-clone-modal"));
        };
        appdetailApi.load(hook);
    });

    self.init();
    return self;
});
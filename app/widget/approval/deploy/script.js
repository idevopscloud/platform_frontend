define(['api', 'common', 'json.human'], function (YM, common, JsonHuman) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;
        this.api = new YM();
        this.api.API_LIST({
            approval: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/app/app/approvals'},
                update: {type: 'PUT', dataType: 'JSON', timeout: 60, url: 'third/app/app/approvals', model:'rest'}
            }
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
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function (query) {
            var self = this;
            self.preLoad ();
            self.bindEvent();
        },
        preLoad: function () {
            var self = this;
            self.humanConfig = {
                showArrayIndex: false,
                hyperlinks : {
                    enable : true,
                    keys: ['version'],          // Keys which will be output as links
                    target : '_blank'       // 'target' attribute of a
                },
                bool : {
                    showText : true,
                    text : {
                        true : "Yes",
                        false : "No",
                    },
                    showImage : true,
                    img : {
                        true : 'assets/images/true.png',
                        false : 'assets/images/false.png'
                    }
                }
            };
            self.loadApprovals();
        },
        bindEvent: function() {
            var self = this;
            $('.deploy-box').delegate('.deploy-diff', 'click', function(event){
                event.preventDefault();
                var tr = $(this).parents('tr');
                if (tr.next(".diff-tr").length > 0) {
                    tr.next().remove();
                    return;
                }
                $('.diff-tr').remove();
                var deploy_id = tr.data('deploy-id');
                var humanData = {};
                if (self.deploy_data[deploy_id]) {
                    var diff_coms = self.deploy_data[deploy_id];
                    $.each(diff_coms, function(diff, coms) {
                        if (coms.length == 0) {
                            return false;
                        }
                        if (!humanData[diff]) {
                            humanData[diff] = {};
                        }

                        $.each(coms, function(_, com){
                            if (!humanData[diff][com.name]) 
                                 humanData[diff][com.name] = {};

                            var definition = JSON.parse(com.definition);
                            $.each(definition, function(_, rc) {
                                if (rc.properties.definition.kind == "ReplicationController") {
                                    var env = {}, vols = {};
                                    if (rc.properties.definition.spec.template.spec.containers[0].env && rc.properties.definition.spec.template.spec.containers[0].env.length > 0) {
                                        $.each(rc.properties.definition.spec.template.spec.containers[0].env, function(_, kv){
                                            env[kv.name] = kv.value;
                                        });
                                    } else {
                                        env = "未设置";
                                    }
                                    if (rc.properties.definition.spec.template.spec.containers[0].volumeMounts) {
                                        $.each(rc.properties.definition.spec.template.spec.containers[0].volumeMounts, function(_, vol){
                                            vols[vol.name] = vol.mountPath;
                                        });
                                    } else {
                                        vols = "未设置";
                                    }
                                    humanData[diff][com.name] = $.extend({
                                        '版本':rc.properties.definition.metadata.labels.version,
                                        '副本':rc.properties.definition.spec.replicas,
                                        '内存': rc.properties.definition.spec.template.spec.containers[0].resources.requests.memory.replace(/Mi/g,'MB') +' ~ ' + rc.properties.definition.spec.template.spec.containers[0].resources.limits.memory.replace(/Mi/g,'MB'),
                                        '加载卷': vols,
                                        '环境变量': env
                                    }, humanData[diff][com.name]);
                                } else if (rc.properties.definition.kind == "Service") {
                                    humanData[diff][com.name] = $.extend({
                                        '服务': rc.properties.definition.spec.ports[0]['protocol'] + '://' + rc.properties.definition.spec.deprecatedPublicIPs[0] + ':' + rc.properties.definition.spec.ports[0]['port']
                                    }, humanData[diff][com.name]);
                                }
                            });
                        });
                    });
                }
                var humanTpl = JsonHuman.format(humanData, self.humanConfig);
                var new_tr = $("<tr class='diff-tr'>").append($("<td colspan='5'>").html(humanTpl));
                tr.after(new_tr);
                
            });
            $('.deploy-box').delegate('.deploy-approve', 'click', function(event){
                event.preventDefault();
                var approval_id = $(this).parents('tr').data('id');
                $('#modal-deploy .modal-body').html("确定同意这次发布？").data('approve', 1).data('approval-id', approval_id);
                $('#modal-deploy').modal('show');
            });
            $('#do-approval').click(function(){
                var approve = $('#modal-deploy .modal-body').data('approve');
                var approval_id = $('#modal-deploy .modal-body').data('approval-id');
                var comment = $('textarea[name=comment]').val();
                var hook = $.extend({}, self.api.loadHooks);
                hook.success = function(msg, data) {
                    common.msgs.pop_up("审核完成", 'success');
                    self.loadApprovals();

                };
                var approvalUpdateApi = self.api.API('approval', 'update',{approve:approve, comment:comment});
                approvalUpdateApi.apiPath += '/'+approval_id;
                approvalUpdateApi.load(hook);
                $('#modal-deploy').modal('hide');
            })
            $('.deploy-box').delegate('.deploy-unapprove', 'click', function(event){
                event.preventDefault();
                var approval_id = $(this).parents('tr').data('id');
                $('#modal-deploy .modal-body').data('approve', 0).data('approval-id', approval_id)
                .html('<div class="form-group">\
                        <label class="col-xs-3 col-sm-3 col-md-3 col-lg-3 text-right">说明</label>\
                        <div class="col-xs-8 col-sm-8 col-md-8 col-lg-8">\
                            <textarea class="form-control" name="comment" rows=5 placeholder="请说明拒绝理由"></textarea>\
                        </div>\
                    </div>');
                $('#modal-deploy').modal('show');
            });
        },
        loadApprovals: function() {
            var self = this;
            var approvalListApi = self.api.API('approval', 'list', {type:'deploy'});
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.beforeSend = function() {
                common.loading.show($('.approval-box'));
            };
            hooks.ajaxComplete = function() {
                common.loading.hide($('.approval-box'));
            };
            hooks.success = function(msg, data) {
                var deploy_body = $('.deploy-box');
                deploy_body.empty();
                self.deploy_data = {};
                $.each(data, function(id, approval) {
                    var deploy = approval.deploy;
                    self.deploy_data[deploy.id] = {};
                    self.deploy_data[deploy.id]['更新的组件'] = deploy.components;
                    self.deploy_data[deploy.id]['运行的组件'] = deploy.old_components;
                    var tr = $('<tr>').data('id', approval.id).data('deploy-id', deploy.id);
                    tr.append($('<td>').html(deploy.instance.name))
                        .append($('<td>').html(deploy.id))
                        .append($('<td>').html(deploy.user_name))
                        .append($('<td>').html(deploy.created_at))
                        .append($('<td>').html("\
                            <button class='btn cbutton cbutton--effect-ivana deploy-diff' aria-hidden='true'>差异</button>\
                            <button class='btn btn-green btn-fill-horz deploy-approve'>同意</button>\
                            <button class='btn btn-red btn-fill-horz deploy-unapprove'>拒绝</button>\
                            "));
                    deploy_body.append(tr);
                });
            };
            approvalListApi.load(hooks);
        },
        dispose : function () {

        }
    });
        return widget;
});

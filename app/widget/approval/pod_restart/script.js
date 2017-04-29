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
            self.loadApprovals();
        },
        bindEvent: function() {
            var self = this;
            $('.deploy-box').delegate('.request-approve', 'click', function(event){
                event.preventDefault();
                var approval_id = $(this).parents('tr').data('id');
                $('#modal-deploy .modal-body').html("确定同意申请？").data('approve', 1).data('approval-id', approval_id);
                $('#modal-deploy').modal('show');
            });

            $('.deploy-box').delegate('.request-reject', 'click', function(event){
                event.preventDefault();
                var approval_id = $(this).parents('tr').data('id');
                $('#modal-deploy .modal-body').data('approve', 0).data('approval-id', approval_id)
                .html('<div class="form-group">\
                        <label class="col-xs-3 col-sm-3 col-md-3 col-lg-3 text-right">拒绝理由</label>\
                        <div class="col-xs-8 col-sm-8 col-md-8 col-lg-8">\
                            <textarea class="form-control" name="comment" rows=5 placeholder="请说明拒绝理由"></textarea>\
                        </div>\
                    </div>');
                $('#modal-deploy').modal('show');
            });

            $('#do-approval').click(function(){
                var approve = $('#modal-deploy .modal-body').data('approve');
                var approval_id = $('#modal-deploy .modal-body').data('approval-id');
                var comment = $('textarea[name=comment]').val();
                var hook = $.extend({}, self.api.loadHooks);
                hook.ajaxComplete = function() {
                    $('#do-approval').button('reset');
                };
                hook.success = function(msg, data) {
                    $('#modal-deploy').modal('hide');
                    common.msgs.pop_up("审核完成", 'success');
                    self.loadApprovals();

                };
                var approvalUpdateApi = self.api.API('approval', 'update',{approve:approve, comment:comment});
                approvalUpdateApi.apiPath += '/'+approval_id;
                approvalUpdateApi.load(hook);
                $('#do-approval').button('loading');
                
            })

            $('.deploy-box').delegate('.request-comment', 'click', function(event){
                event.preventDefault();
                var comment = $(this).parents('tr').data('comment');
                $('#modal-confirm .modal-body').html(comment);
                $('#modal-confirm').modal('show');
            });
        },
        loadApprovals: function() {
            var self = this;
            var approvalListApi = self.api.API('approval', 'list', {type: 'pod_restart'});
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.beforeSend = function() {
                common.loading.show($('.approval-box'));
            };
            hooks.ajaxComplete = function() {
                common.loading.hide($('.approval-box'));
            };
            hooks.success = function(msg, data) {
                var box = $('.deploy-box').empty();
                $.each(data, function(id, approval) {
                    var tr = $('<tr>').data('id', approval.id).data('comment', approval.comment);
                    tr.append($('<td>').html(approval.instance.name))
                        .append($('<td>').html(approval.pod.name))
                            .append($('<td>').html(approval.user_name))
                                .append($('<td>').html(approval.created_at));
                    var td_op = $('<td>'); 
                    var comment = $("<button class='btn btn-green btn-fill-horz request-comment'>说明</button>");     
                    if (!approval.comment)
                        comment.prop('disabled', true);
                    td_op.append(comment)
                            .append("<button class='btn btn-green btn-fill-horz  request-approve'>同意</button>\
                                        <button class='btn btn-red btn-fill-horz request-reject'>拒绝</button>");
                    tr.append(td_op);
                    box.append(tr);
                });
            };
            approvalListApi.load(hooks);
        },
        dispose : function () {

        }
    });
        return widget;
});

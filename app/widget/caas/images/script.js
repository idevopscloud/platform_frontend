define(['api', 'common', 'select2','jquery.validate', 'validate_localization/messages_zh'], function (YM, common) {
    'use strict';
    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            repo : {
                lists: {type: 'GET', dataType: 'JSON', timeout: 60, url:'third/app/caas/repos'},
                show: {type: 'GET', dataType: 'JSON', timeout: 60, url:'third/app/caas/repos'},
            },
            instance : {
                create: {type: 'POST', dataType: 'JSON', timeout: 60, url:'third/app/caas/instances'}
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
        };
        this.repos = [];
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function (query) {
            var self = this;
            self.prevload();
            self.bindEvent (query);
        },
        prevload: function() {
            var self = this;
            self.loadRepos();
        },
        loadRepos: function () {
            var self = this;
            var repoListApi = self.api.API('repo', 'lists');
            var hooks = $.extend({},self.api.loadHooks);
            hooks.success = function(msg, data) {
                var repo_list_body = $('#repo-box').empty();
                $.each(data, function(id, repo) {
                    var tr = $('<tr>')
                        .data('id', repo.id)
                            .append($('<td>').html(repo.name))
                                .append($('<td>').html(repo.description));
                    repo_list_body.append(tr);
                    $('#repo').append($('<option>').val(repo.id).text(repo.name));
                });
                self.repos = data;
            };
            repoListApi.load(hooks);
        },
        bindEvent: function (query) {
            var self = this;
            $('#repo').select2({width: '100%'});
            $('#repo-tag').select2({minimumResultsForSearch: -1, width: '100%'});
            $.validator.addMethod("regex", function(value, element,params) {
                return (this.optional(element) == true) || params.test(value);
            });
            $('#repo').on('select2:select', function(){
                var repDetailApi = self.api.API('repo', 'show');
                repDetailApi.apiPath += '/'+$(this).val();
                var hooks = $.extend({},self.api.loadHooks);
                hooks.success = function(msg, data) {
                    if (!data.tags) {
                        return;
                    }
                    $('#repo-tag').empty().select2('data',{});
                    var first = null;
                    $.each(data.tags, function(id, tag) {
                        if (!first) {
                            first = tag.tag;
                        }
                        $('#repo-tag').append($('<option>').val(tag.tag).text(tag.tag));
                    });
                    $('#repo-tag').prop("disabled", false).select2('val', first);
                };
                hooks.beforeSend = function(){
                    $('#repo-tag').prop("disabled", true);
                },
                repDetailApi.load(hooks);
            });
            $('.add-container').on('click', function() {
                $('#modal-new').modal('show');
            });

            $('#envTable').delegate('tr.clicksTr','click', function () {
                var _this = $(this);
                var allTr = $('tr', '#envTable');
                if(!_this.hasClass('success')){
                    allTr.removeClass('success');
                    _this.addClass('success');
                }else{
                    _this.removeClass('success');
                }
            });

            $('button.del').on('click', function (e) {
                e.preventDefault();
                var trObj = $('#envTable').find('tr.success');
                trObj.remove();
            });

            $('button.mod').on('click', function (e) {
                e.preventDefault();
                var trObj = $('#envTable').find('tr.success');
                var objKey = $('input[name="key"]');
                var objVal = $('input[name="value"]');
                var key = trObj.children().first().html();
                var val = trObj.children().last().html();
                if (key && val) {
                    objKey.val(key);
                    objVal.val(val);
                    trObj.remove();
                }
            });

            $('button.add').on('click', function (e) {
                e.preventDefault();
                var tableObj = $('#envTable');
                var objKey = $('input[name="key"]');
                var objVal = $('input[name="value"]');
                    
                if(objKey.val() != '' && objVal.val() != '') {
                    var exist = false;
                    tableObj.find('tr').each(function() {
                        var key = $(this).children().first().html();
                        if (key == objKey.val()) {
                            exist = true;
                            return;
                        }
                    });
                    if (exist) {
                        common.msgs.pop_up('环境变量已存在', 'error');
                        return false;
                    }
                    $('tr', tableObj).removeClass('success');
                    tableObj.append(
                        $('<tr>').addClass('clicksTr').append($('<td>').html(objKey.val()))
                                    .append($('<td>').html(objVal.val()))
                    );
                } else {
                    common.msgs.pop_up('请输入有效的ENV数据', 'error');
                }
                objKey.val('').focus();
                objVal.val('').focus();
            });

            //create instance
            $('#do-new').on('click', function() {
                var form = $('#modal-form-new');
                var validator = form.validate({
                    lang: 'zh',
                    rules: {
                        'name': {
                            required: true,
                            regex:/^[a-z][a-z0-9-]*[a-z0-9]$/,
                            rangelength:[3, 50],
                        },
                        'version': {required:true},
                        'image': {required:true},
                        'requests_memory': {required:true,digits:true, min:1},
                        'targetPort': {digits:true,min:1,max:65535}
                    },
                    messages: {
                        'name': "允许小写英文字母、数字和中划线。以字母开头，字母或者数字结尾，且长度在3~50之间",
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

                $('#envTable').find('tr').each(function() {
                    if (!params['env']) {
                        params['env'] = [];
                    }
                    var key = $(this).children().first().html();
                    var val = $(this).children().last().html();
                    params['env'].push({name:key, value:val});
                });
                var instanceCreateApi = self.api.API('instance', 'create', params);
                var hooks = $.extend({},self.api.loadHooks);
                hooks.success = function(msg, data) {
                    common.msgs.pop_up("实例创建成功", 'success');
                    window.location.hash = '#!/app/caas_status';
                };
                $('#modal-new').modal('hide');
                instanceCreateApi.load(hooks);
            });
        },
        dispose:function() {}
    });

    return widget;
});
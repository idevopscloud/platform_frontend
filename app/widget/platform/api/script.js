define(['api', 'common', 'select2'], function (YM, common, Ant) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            userApi: {
                lists: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'userApi/lists'},
                create: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'userApi/save'},
                update: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'userApi/save'},
                delete: {type: 'POST', dataType: 'JSON', timeout: 60},
                show: {type: 'GET', dataType: 'JSON', timeout: 60}
            },
            module: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'modules/lists'}
            }
        });
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function () {
            var self = this;
            var tableBox = $('#tableBox');

            $("#module_id, #group_id, #level_id").select2({'width': '100%'});
           
            // get process list
            var tableListApi = self.api.API('userApi', 'lists');
            tableListApi.load({
                beforeSend: function(){
                    common.loading.show(self.dom);
                },
                success: function(msg, data){
                    tableBox.empty();
                    listTableData(data);
                },
                fail: function(msg,data,code){
                    common.msgs.pop_up(msg, 'error');
                },
                ajaxFail : function(msg){
                    common.msgs.pop_up(msg, 'error');
                },
                ajaxComplete: function(){
                    common.loading.hide(self.dom);
                }
            });

            function listTableData (data) {
                if(data){
                    for(var i=0; i<data.length; i++){
                        var str = '<tr>'+
                            '<td>'+data[i].id+'</td>'+
                            '<td>'+data[i].name+'</td>'+
                            '<td>'+data[i].link+'</td>'+
                            '<td>'+data[i].method+'</td>'+
                            '<td><a class="btn btn-warning btn-xs" data-id="'+data[i].id+'" data-num="'+i+'" name="edit">修改</a><a class="btn btn-warning btn-xs" data-id="'+data[i].id+'" name="delete">删除</a></td>'+
                            '</tr>';
                        tableBox.append(str);
                    }
                    $('a[name="edit"]').on('click', function() {
                        var _this = $(this);
                        var thisId = _this.data('id');

                        showModalBox ();

                        var editApi = self.api.API('userApi', 'show', {id: thisId});
                        editApi.load({
                            success: function (msg, data) {
                                $('#name').val(data.name);
                                $('#link').val(data.link);
                                $('#method').val(data.method);
                                $('#controller').val(data.controller);
                                $('#action').val(data.action);
                                getModuleList(data.module_id);

                                $('#saveSetting').unbind().on('click', function () {

                                    var params = $('#modal-form').serialize() + '&id=' + thisId;
                                    var updataApi = self.api.API('userApi', 'update', params);
                                    updataApi.load({
                                        success: function (msg, data) {
                                            window.location.hash = '#!/platform/api?_r=' + Math.floor(Math.random() * 100000000000 )
                                        },
                                        fail: function (msg) {
                                            common.msgs.pop_up(msg, 'error');
                                        }
                                    })
                                })
                            },
                            fail: function (msg) {
                                common.msgs.pop_up(msg, 'error');
                            }
                        })

                        
                    })

                    $('a[name="delete"]').on('click', function() {
                        var _this = $(this);
                        var thisId = _this.data('id');

                        var deleteApi = self.api.API('userApi', 'delete', {id: thisId});
                        deleteApi.load({
                                success: function (msg) {
                                    window.location.hash = '#!/platform/api?_r=' + Math.floor(Math.random() * 100000000000 )
                                },
                                fail: function (msg) {
                                    common.msgs.pop_up(msg, 'error');
                                }
                            })
                    })
                }
            }            

            function showModalBox () {
                $('input').val('');
                $('#settingModal').modal('show');
            }
            function getModuleList(defaultValue) {
                var theApi = self.api.API('module', 'list');
                theApi.load({
                    success: function(msg, data){
                        $("#module_id").empty();
                        if (data !== null) {
                            $("#module_id").html("<option></option>");
                            for (var i=0;i < data.length; i++) {
                                var item = $("<option>").val(data[i].id).text(data[i].name);
                                $("#module_id").append(item);
                            }
                        }
                        defaultValue = defaultValue ? defaultValue : '';
                        $("#module_id").val(defaultValue).trigger('change');
                    }
                });
            }
            $('#apply').on('click', function () {
                showModalBox ();
                getModuleList();
                $('#saveSetting').unbind().on('click', function () {
                    var params = $('#modal-form').serialize();
                    var Api = self.api.API('userApi', 'create', params);

                    Api.load({
                        beforeSend: function(){
                            common.loading.show(self.dom);
                        },
                        success: function(msg, data){
                            $('#settingModal').modal('hide');
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        },
                        fail: function(msg,data,code){
                            common.msgs.pop_up(msg, 'error');
                        },
                        ajaxFail : function(msg){
                            common.msgs.pop_up(msg, 'error');
                        },
                        ajaxComplete: function(){
                            common.loading.hide(self.dom);
                        }
                    })
                })
            });

            $('#user_group').on('click', function () {

                $('select').val('').trigger('change');
                $('#linkModal').modal('show');
                
                $('#doSetting').unbind().on('click', function () {
                    var params = $('#userModalForm').serializeArray();
                    var applyAppApi = self.api.API('level', 'create', params);

                    applyAppApi.load({
                        beforeSend: function(){
                            common.loading.show(self.dom);
                        },
                        success: function(msg, data){
                            $('#settingModal').modal('hide');
                            window.location.hash = '#!/pr_template/level?_r=' + Math.floor(Math.random() * 100000000000 )
                        },
                        fail: function(msg,data,code){
                            common.msgs.pop_up(msg, 'error');
                        },
                        ajaxFail : function(msg){
                            common.msgs.pop_up(msg, 'error');
                        },
                        ajaxComplete: function(){
                            common.loading.hide(self.dom);
                        }
                    })
                })
            });
            
            $('li', '.nav-tabs').on('click', function () {
                $('li', '.nav-tabs').removeClass('active');
                $(this).addClass('active');
                window.location.hash = $(this).attr('data-url');
            })
        },
        dispose: function () {
        }
    });

    return widget;
});

define(['api', 'common', 'select2'], function (YM, common, Ant) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            module: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'modules/lists'},
                create: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'modules/save'},
                update: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'modules/save'},
                deleted: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'modules/delete'},
                show: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'modules/show'}
            }
        });
    };


    widget.prototype = $.extend(widget.prototype, {
        init: function () {
            var self = this;
            var tableBox = $('#tableBox');

            $("#role, #menu,#roles,#apis").select2({'width': '100%'});

            var tableListApi = self.api.API('module', 'list');
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
                            '<td>'+data[i].updated_at+'</td>'+
                            '<td><a class="btn btn-warning btn-xs" data-id="'+data[i].id+'" data-name="'+data[i].name+'"  data-num="'+i+'" name="edit">修改</a><a class="btn btn-warning btn-xs" data-id="'+data[i].id+'" name="delete">删除</a></td>'+
                            '</tr>';
                        tableBox.append(str);
                    }

                    $('a[name="edit"]').on('click', function() {
                        var _this = $(this);
                        var thisId = _this.data('id');

                        showModalBox ();
                        $('#name').val(_this.data('name'));


                        $('#saveSetting').unbind().on('click', function () {
                            $('#saveSetting').attr('disabled', false);

                            var params = $('#modal-form').serialize() + '&id=' + thisId;
                            var updataApi = self.api.API('module', 'update', params);
                            updataApi.load({
                                success: function (msg, data) {
                                    $('#settingModal').modal('hide');
                                    setTimeout(function() {
                                        location.reload();
                                    }, 2000);
                                },
                                fail: function (msg) {
                                    common.msgs.pop_up(msg, 'error');
                                }
                            })
                        })
                    })

                    $('a[name="delete"]').on('click', function() {
                        var _this = $(this);
                        var thisId = _this.data('id');
                        if (confirm('确定删除？')) {
                            var deleteApi = self.api.API('module', 'deleted', {id: thisId});
                            deleteApi.load({
                                success: function (msg) {
                                    setTimeout(function() {
                                        location.reload();
                                    }, 2000);
                                },
                                fail: function (msg) {
                                    common.msgs.pop_up(msg, 'error');
                                }
                            })
                        }
                    })
                }
            }

            function showModalBox () {
                $('input').val('');
                $('#settingModal').modal('show');
            }

            $('#apply').on('click', function () {
                showModalBox ();
                $('#saveSetting').unbind().on('click', function () {
                    if ($('#name').val().length < 1) {
                        common.msgs.pop_up('名称不能为空', 'error');
                        $('#name').focus();
                        return false;
                    }
                    var params = $('#modal-form').serialize();

                    var applyAppApi = self.api.API('module', 'create', params);

                    applyAppApi.load({
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

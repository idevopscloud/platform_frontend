define(['api', 'common', 'select2'], function (YM, common, Ant) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            group: {
                lists: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'groups/lists'},
                create: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'groups/save'},
                deleted: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'groups/delete'},
                user: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'groups/user'}
            },
        });
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function () {
            var self = this;
            var tableBox = $('#tableBox');

            $("#classification_id, #group_id, #level_id").select2({'width': '100%'});
           
            // get process list
            var tableListApi = self.api.API('group', 'lists');
            tableListApi.load({
                beforeSend: function(){
                    common.loading.show(self.dom);
                },
                success: function(msg, data){
                    tableBox.empty();
                    listTableData(data.data);
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
                if (!data) {
                } else {
                    for (var i = 0; i < data.length; i++) {
                        var roles = data[i].roles;
                        var role = '';
                        for (var index = 0; index < roles.length; index++) {
                            role += roles[index].name + ',';
                        }
                        var str = '<tr>' +
                            '<td>' + data[i].id + '</td>' +
                            '<td>' + data[i].name + '</td>' +
                            '<td>' + role + '</td>' +
                            '<td>' + data[i].user_count + '</td>' +
                            '<td><a class="btn btn-warning btn-xs" data-id="' + data[i].id + '"  data-num="' + i + '" name="member">成员</a><a class="btn btn-warning btn-xs" data-id="' + data[i].id + '" data-name="' + data[i].name + '" data-num="' + i + '" name="edit">修改</a><a class="btn btn-warning btn-xs" data-id="' + data[i].id + '" name="delete">删除</a></td>' +
                            '</tr>';
                        tableBox.append(str);
                    }

                    $('a[name="member"]').on('click', function () {
                        var _this = $(this);
                        var thisId = _this.data('id');

                        var userApi = self.api.API('group', 'user', {id:thisId});
                        userApi.load({
                            success: function (msg, data) {
                                var tableBox = $('#userBody');
                                tableBox.empty();
                                if(data.length != 0){
                                    for (var id in data)  {
                                        var str = '<tr>' +
                                            '<td>' + id + '</td>' +
                                            '<td>' + data[id] + '</td>' +
                                            '</tr>';
                                        tableBox.append(str);
                                    }
                                }
                                $('#userModal').modal('show');
                            },
                            fail: function (msg) {
                                common.msgs.pop_up(msg, 'error');
                            }
                        })
                    })

                    $('a[name="edit"]').on('click', function () {
                        var _this = $(this);
                        var thisId = _this.data('id');

                        showModalBox();
                        $('#name').val(_this.data('name'));

                        $('#saveSetting').unbind().on('click', function () {

                            var params = $('#modal-form').serialize() + '&id=' + thisId;
                            var updateApi = self.api.API('group', 'create', params);
                            updateApi.load({
                                success: function (msg, data) {
                                    $('#settingModal').modal('hide');
                                    setTimeout(function () {
                                        location.reload();
                                    }, 2000);
                                },
                                fail: function (msg) {
                                    common.msgs.pop_up(msg, 'error');
                                }
                            })
                        })
                    })

                    $('a[name="delete"]').on('click', function () {
                        var _this = $(this);
                        var thisId = _this.data('id');
                        if (confirm('确定删除？')) {
                            var deleteApi = self.api.API('group', 'deleted', {id: thisId});
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
                    var params = $('#modal-form').serialize();
                    var applyAppApi = self.api.API('group', 'create', params);

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

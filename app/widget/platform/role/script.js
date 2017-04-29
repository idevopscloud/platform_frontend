define(['api', 'common', 'select2'], function (YM, common, Ant) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            role: {
                lists: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'roles/lists'},
                create: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'roles/save'},
                deleted: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'roles/delete'},
                user: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'roles/user'},
                syncMenu:{type: 'POST', dataType: 'JSON', timeout: 60, url: 'roles/sync-menu'},
                grantMenu:{type: 'POST', dataType: 'JSON', timeout: 60, url: 'roles/grant-menu'},
                stripMenu:{type: 'POST', dataType: 'JSON', timeout: 60, url: 'roles/strip-menu'},
                grantApi:{type: 'POST', dataType: 'JSON', timeout: 60, url: 'roles/grant-api'},
                stripApi:{type: 'POST', dataType: 'JSON', timeout: 60, url: 'roles/strip-api'},
                roleName:{type: 'GET', dataType: 'JSON', timeout: 60, url: 'roles/lists'},
                menuName:{type: 'GET', dataType: 'JSON', timeout: 60, url: 'menus/lists'},
                apiName:{type: 'GET', dataType: 'JSON', timeout: 60, url: 'userApi/lists'},
                menuAll:{type: 'GET', dataType: 'JSON', timeout: 60, url: 'menus/menu'},
                menu:{type: 'GET', dataType: 'JSON', timeout: 60, url: 'roles/menu'}
            },
        });
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function () {
            var self = this;
            var tableBox = $('#tableBox');

            $("#role, #menu,#roles,#apis").select2({'width': '100%'});
            // get process list
            var tableListApi = self.api.API('role', 'lists');
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
                if(data){
                    for(var i=0; i<data.length; i++){
                        var str = '<tr>'+
                            '<td>'+data[i].id+'</td>'+
                            '<td>'+data[i].name+'</td>'+
                            '<td>'+data[i].description+'</td>'+
                            '<td>'+data[i].user_count+'</td>'+
                            '<td><a class="btn btn-warning btn-xs" data-id="'+data[i].id+'" data-num="'+i+'" name="detail">详情</a><a class="btn btn-warning btn-xs" data-id="'+data[i].id+'" data-num="'+i+'" name="member">成员</a><a class="btn btn-warning btn-xs" data-id="'+data[i].id+'" data-name="'+data[i].name+'"  data-description="'+data[i].description+'" data-num="'+i+'" name="edit">修改</a><a class="btn btn-warning btn-xs" data-id="'+data[i].id+'" name="delete">删除</a></td>'+
                            '</tr>';
                        tableBox.append(str);
                    }

                    $('a[name="detail"]').on('click', function() {
                        var _this = $(this);
                        var thisId = _this.data('id');
                        var menu_list = [],menu_tree="";
                        $('#showModal').modal('show');
                        var Api = self.api.API('role', 'menuAll');
                        var content="";
                        Api.load({
                            success: function (msg, data) {
                                content += '<ol class="dd-list">';
                                for (var i in data) {
                                    var parent  = data[i],
                                        child = data[i].pages;

                                    content += '<li class="dd-item" data-id="' + parent.id + '">' +
                                        '<div class="dd-handle">' +
                                        '<input class="menu-item" type="checkbox" value="1" data-id="' + parent.id + '" >' +
                                        parent.name +
                                        '</div>';
                                    if (child) {
                                        content += '<ol class="dd-list">';

                                        for (var j=0;j<child.length;j++) {
                                            var parent  = child[j];

                                            content += '<li class="dd-item" data-id="' + parent.id + '">' +
                                                '<div class="dd-handle">' +
                                                '<input class="menu-item" type="checkbox" value="1" data-id="' + parent.id + '" >' +
                                                parent.name +
                                                '</div>';
                                            content += '</li>';
                                            menu_list[parent.id] = parent;
                                        }

                                        content += '</ol>';
                                    }

                                    content += '</li>';

                                    menu_list[parent.id] = parent;
                                }
                                content += '</ol>';
                                $('#show_menu_tree').html(content);

                                var menuApi = self.api.API('role', 'menu', {id:thisId});
                                menuApi.load({
                                    success: function (msg, data) {
                                        $.each(data, function(k, v) {
                                            $('#show_menu_tree .menu-item[data-id="'+k+'"]').prop('checked', 'checked');
                                        });
                                    },
                                    fail: function (msg) {
                                        common.msgs.pop_up(msg, 'error');
                                    }
                                })
                            },
                            fail: function (msg) {
                                common.msgs.pop_up(msg, 'error');
                            }
                        })

                        $('.act-sync').unbind().on('click', function() {
                            $('.act-sync').attr('disabled', true);

                            var role =  _this.data('id');

                            var menu  = $('#show_menu_tree  .menu-item:checked').map(function(){
                                return $(this).data('id');
                            }).get();

                            menu = menu.join(',');

                            var syncApi = self.api.API('role', 'syncMenu',{roles: role, menus: menu});
                            syncApi.load({
                                success: function (msg, data) {
                                    common.msgs.pop_up("授权成功", 'info');
                                    $('.act-sync').attr('disabled', false);

                                },
                                fail: function (msg) {
                                    common.msgs.pop_up(msg, 'error');
                                }
                            })
                        });
                    })

                    $('a[name="member"]').on('click', function () {
                        var _this = $(this);
                        var thisId = _this.data('id');

                        var userApi = self.api.API('role', 'user', {id:thisId});
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

                    $('a[name="edit"]').on('click', function() {
                        var _this = $(this);
                        var thisId = _this.data('id');

                        showModalBox ();
                        $('#name').val(_this.data('name'));
                        $('#description').val(_this.data('description'));


                        $('#saveSetting').unbind().on('click', function () {
                            $('#saveSetting').attr('disabled', false);

                            var params = $('#modal-form').serialize() + '&id=' + thisId;
                            var updataApi = self.api.API('role', 'create', params);
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
                            var deleteApi = self.api.API('role', 'deleted', {id: thisId});
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
                // getProjects();
                $('#saveSetting').unbind().on('click', function () {
                    if ($('#name').val().length < 1) {
                        common.msgs.pop_up('名称不能为空', 'error');
                        $('#name').focus();
                        return false;
                    }
                    if ($('#description').val().length < 1) {
                        common.msgs.pop_up('描述不能为空', 'error');
                        $('#description').focus();
                        return false;
                    }
                    var params = $('#modal-form').serialize();

                    var applyAppApi = self.api.API('role', 'create', params);

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

            $('#role_menu').on('click', function () {
                $('select').val('').trigger('change');
                $('#roleMenuModal').modal('show');
                getRoleMenu();
                $('#grantRoleMenu').unbind().on('click', function () {
                    var params={
                        menus:$('#menu').val().join(','),
                        roles:$('#role').val().join(',')
                    };
                    var Api = self.api.API('role', 'grantMenu', params);
                    Api.load({
                        success: function(msg, data){
                            $('#roleMenuModal').modal('hide');
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        }
                    });
                })

                $('#stripRoleMenu').unbind().on('click', function () {
                    var params={
                        menus:$('#menu').val().join(','),
                        roles:$('#role').val().join(',')
                    };
                    var Api = self.api.API('role', 'stripMenu', params);
                    Api.load({
                        success: function(msg, data){
                            $('#roleMenuModal').modal('hide');
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        }
                    });
                })
            });

            $('#role_api').on('click', function () {
                $('select').val('').trigger('change');
                $('#roleApiModal').modal('show');
                getRoleApi();
                $('#grantRoleApi').unbind().on('click', function () {
                    var params={
                        apis:$('#apis').val().join(','),
                        roles:$('#roles').val().join(',')
                    };
                    var Api = self.api.API('role', 'grantApi', params);
                    Api.load({
                        success: function(msg, data){
                            $('#roleApiModal').modal('hide');
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        }
                    });
                })
                $('#stripRoleApi').unbind().on('click', function () {
                    var params={
                        apis:$('#apis').val().join(','),
                        roles:$('#roles').val().join(',')
                    };
                    var Api = self.api.API('role', 'stripApi', params);
                    Api.load({
                        success: function(msg, data){
                            $('#roleApiModal').modal('hide');
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        }
                    });
                })
            });

            function getRoleMenu() {
                var theApi = self.api.API('role', 'roleName');
                theApi.load({
                    success: function(msg, data){
                        $("#role").html("<option></option>");
                        if (data.data) {
                            $.each(data.data, function (i, n) {
                                var item = $('<option value="'+n.id+'">'+n.name+'</option>');
                                $("#role").append(item);
                            })
                        }
                        $("#role").trigger('change')
                    }
                });

                var userApi = self.api.API('role', 'menuName');
                userApi.load({
                    success: function(msg, data){
                        $("#menu").html("<option></option>");
                        if (data) {
                            $.each(data, function (i, n) {
                                var item = $('<option value="'+n.id+'">'+n.name+'</option>');
                                $("#menu").append(item);
                            })
                        }
                        $("#menu").trigger('change')
                    }
                });
            }
            function getRoleApi() {
                var theApi = self.api.API('role', 'roleName');
                theApi.load({
                    success: function(msg, data){
                        $("#roles").html("<option></option>");
                        if (data.data) {
                            $.each(data.data, function (i, n) {
                                var item = $('<option value="'+n.id+'">'+n.name+'</option>');
                                $("#roles").append(item);
                            })
                        }
                        $("#roles").trigger('change')
                    }
                });


                var theApi = self.api.API('role', 'apiName');
                theApi.load({
                    success: function(msg, data){
                        $("#apis").html("<option></option>");
                        if (data) {
                            $.each(data, function (i, n) {
                                var item = $('<option value="'+n.id+'">'+n.name+'</option>');
                                $("#apis").append(item);
                            })
                        }
                        $("#apis").trigger('change')
                    }
                });
            }
        },
        dispose: function () {
        }
    });

    return widget;
});

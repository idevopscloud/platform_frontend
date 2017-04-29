define(['api', 'common', 'select2', 'pages', 'datetimepicker'], function (YM, common) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            users: {
                lists: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'users/lists'},
                grantRole: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'users/grant-role'},
                stripRole: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'users/strip-role'},
                joinGroup: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'users/join-group'},
                leaveGroup: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'users/leave-group'},
                roles: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'roles/lists'},
                groups: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'groups/lists'},
                show: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/user/userProfile/show'},
                search: {type: 'GET', dataType: 'JSON', timeout: 60}
            },
        });
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function (query) {
            var self = this;
            var tableBox = $('#tableBox');
            var page = query.page || 1;
            $("#role, #user,#users,#groups").select2({'width': '100%'});

            // get process list
            var tableListApi = self.api.API('users', 'lists', {page: page});
            tableListApi.load({
                beforeSend: function(){
                    common.loading.show(self.dom);
                },
                success: function(msg, data){
                    tableBox.empty();
                    listPaginate(data);
                    listTableData(data.data);
                    pager(data, '#!/platform/user');
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

            function listPaginate(data){
                if(data){
                    $('.list-total-num').html(data.total);
                    var current_page = parseInt(data.current_page),
                        per_page     = parseInt(current_page - 1),
                        last_page    = parseInt(data.last_page),
                        begin        = current_page - 5,
                        end          = 5 + current_page,
                        next_page    = current_page + 1;
                    if (begin < 1) begin = 1;

                    var str='<ul class="pagination pagination-xs nomargin pagination-custom">';
                    if (current_page == 1) {
                        str+='<li class="disabled"><a  name="link" data-page="'+current_page+'"><i class="fa fa-angle-double-left"></i></a></li>';
                    } else {
                        str+='<li><a name="link" data-page="'+per_page+'" ><i class="fa fa-angle-double-left"></i></a></li>';

                    }
                    for (;begin < end; begin++) {
                        if (begin > last_page) break;

                        if (current_page == begin) {
                            str+='<li class="active"><a  name="link" data-page="'+current_page+'">'+begin+'</a></li>';
                        }else{
                            str+='<li><a  name="link" data-page="'+begin+'">'+begin+'</a></li>';
                        }
                    }
                    if (next_page > last_page) {
                        str+='<li class="disabled"><a  name="link" data-page="'+current_page+'"><i class="fa fa-angle-double-right"></i></a></li>';
                    }else{
                        str+='<li><a  name="link" data-page="'+next_page+'"><i class="fa fa-angle-double-right"></i></a></li>';
                    }
                    str+='</ul>';
                    $('#pageBox').html(str);
                }
            }

            function listTableData (data) {
                if(data){
                    for(var i=0; i<data.length; i++){
                        var roles = data[i].roles;
                        var role = '';
                        for (var index=0;index<roles.length;index++) {
                            role += roles[index].name + ',';
                        }

                        var str = '<tr>'+
                            '<td>'+data[i].id+'</td>'+
                            '<td>'+data[i].username+'</td>'+
                            '<td>'+data[i].nikename+'</td>'+
                            '<td>'+role+'</td>'+
                            '<td><a class="btn btn-warning btn-xs" data-id="'+data[i].id+'" data-num="'+i+'" name="detail">详情</a></td>'+
                            '</tr>';
                        tableBox.append(str);
                    }
                    $('a[name="detail"]').on('click', function() {
                        var _this = $(this);
                        var thisId = _this.data('id');

                        showModalBox ();
                        $('#name').text(thisId);

                        $('#saveSetting').unbind().on('click', function () {

                            var params = $('#modal-form').serialize() + '&review_id=1&id=' + thisId;
                            var updataApi = self.api.API('event', 'create', params);
                            updataApi.load({
                                success: function (msg, data) {
                                    window.location.hash = '#!/pr_template/group?_r=' + Math.floor(Math.random() * 100000000000 )
                                },
                                fail: function (msg) {
                                    common.msgs.pop_up(msg, 'error');
                                }
                            })
                        })
                    })

                    $('a[name="link"]').on('click',function(){
                        var tableBox = $('#tableBox');
                        var _this = $(this);
                        var thisPage = _this.data('page');


                        // get process list
                        var ListApi = self.api.API('users', 'lists',{page: thisPage});
                        ListApi.load({
                            success: function(msg, data){
                                tableBox.empty();
                                listPaginate(data);
                                listTableData(data.data);
                            },
                            fail: function(msg,data,code){
                                common.msgs.pop_up(msg, 'error');
                            }
                        });

                    })
                }
            }

            $('#user_role').on('click', function () {
                $('select').val('').trigger('change');
                $('#userRoleModal').modal('show');
                getTemplates();
                $('#grantUserRole').unbind().on('click', function () {
                    var params={
                        users:$('#user').val().join(','),
                        roles:$('#role').val().join(',')
                    };
                    var userRoleApi = self.api.API('users', 'grantRole', params);
                    userRoleApi.load({
                        success: function(msg, data){
                            $('#userRoleModal').modal('hide');
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        }
                    });
                })

                $('#stripUserRole').unbind().on('click', function () {
                    var params={
                        users:$('#user').val().join(','),
                        roles:$('#role').val().join(',')
                    };
                    var userRoleApi = self.api.API('users', 'stripRole', params);
                    userRoleApi.load({
                        success: function(msg, data){
                            $('#userRoleModal').modal('hide');
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        }
                    });
                })
            });
            function getTemplates() {
                var theApi = self.api.API('users', 'roles');
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

                var userApi = self.api.API('users', 'search', {key: 'card'});
                userApi.load({
                    success: function(msg, data){
                        $("#user").html("<option></option>");
                        if (data) {
                            $.each(data, function (i, n) {
                                var item = $('<option value="'+n.id+'">'+n.name+'</option>');
                                $("#user").append(item);
                            })
                        }
                        $("#user").trigger('change')
                    }
                });
            }

            function showModalBox () {
                $('input').val('');
                $('#settingModal').modal('show');
            }

            $('#apply').on('click', function () {
                showModalBox ();
                // getProjects();
                $('#saveSetting').unbind().on('click', function () {
                    var params = $('#modal-form').serialize();
                    var applyAppApi = self.api.API('group', 'create', params);

                    applyAppApi.load({
                        beforeSend: function(){
                            common.loading.show(self.dom);
                        },
                        success: function(msg, data){
                            $('#settingModal').modal('hide');
                            window.location.hash = '#!/pr_template/group?_r=' + Math.floor(Math.random() * 100000000000 )
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
                getUsersGroups()
                $('#joinGroupSetting').unbind().on('click', function () {
                    var params={
                        users:$('#users').val().join(','),
                        groups:$('#groups').val().join(',')
                    };
                    var applyAppApi = self.api.API('users', 'joinGroup', params);
                    applyAppApi.load({
                        success: function(msg, data){
                            $('#linkModal').modal('hide');
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        }
                    });
                })
                $('#leaveGroupSetting').unbind().on('click', function () {
                    var params={
                        users:$('#users').val().join(','),
                        groups:$('#groups').val().join(',')
                    };
                    var applyAppApi = self.api.API('users', 'leaveGroup', params);
                    applyAppApi.load({
                        success: function(msg, data){
                            $('#linkModal').modal('hide');
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        }
                    });
                })
            });

            function getUsersGroups() {
                var theApi = self.api.API('users', 'groups');
                theApi.load({
                    success: function(msg, data){
                        $("#groups").html("<option></option>");
                        if (data.data) {
                            $.each(data.data, function (i, n) {
                                var item = $('<option value="'+n.id+'">'+n.name+'</option>');
                                $("#groups").append(item);
                            })
                        }
                        $("#groups").trigger('change')
                    }
                });

                var userApi = self.api.API('users', 'search', {key: 'card'});
                userApi.load({
                    success: function(msg, data){
                        $("#users").html("<option></option>");
                        if (data) {
                            $.each(data, function (i, n) {
                                var item = $('<option value="'+n.id+'">'+n.name+'</option>');
                                $("#users").append(item);
                            })
                        }
                        $("#users").trigger('change')
                    }
                });
            }

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

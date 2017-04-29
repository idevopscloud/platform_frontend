define(['api', 'common', 'select2'], function (YM, common, Ant) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            menu: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'menus/menu'},
                create: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'menus/save'},
                update: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'menus/save'},
                deleted: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'menus/delete'}
            },
            module: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'modules/lists'}
            },
        });
    };


    widget.prototype = $.extend(widget.prototype, {
        init: function () {
            var self = this;
            var tableBox = $('#menu_tree');


            $("#module_id").select2({'width': '100%'});

            var tableListApi = self.api.API('menu', 'list');
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
                    var menu_list = [],menu_tree="";

                    var content="";
                    content += '<ol class="dd-list">';
                    for (var i in data) {
                        var parent  = data[i],
                            child = data[i].pages;

                        content += '<li class="dd-item" data-id="' + parent.id + '">' +
                            '<div class="dd-handle">' +
                                '<span>' + parent.name + '</span>' +
                                '<div class="menu-panel">' +
                                '</div>' +
                            '</div>';
                        if (child) {
                            content += '<ol class="dd-list">';

                            for (var j=0;j<child.length;j++) {
                                var parent  = child[j];

                                content += '<li class="dd-item" data-id="' + parent.id + '">' +
                                    '<div class="dd-handle">' +
                                    '<span>' + parent.name + '</span>' +
                                    '<div class="menu-panel">' +
                                    '<a class="btn btn-warning btn-xs" data-id="'+parent.id+'" data-name="'+parent.name+'" data-module_id="'+parent.module_id+'" data-link="'+parent.link+'" name="edit">修改</a>'+
                                    '<a class="btn btn-warning btn-xs" data-id="'+parent.id+'" name="delete">删除</a>'+
                                    '</div>' +
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
                    tableBox.html(content);

                    $('a[name="edit"]').on('click', function() {
                        var _this = $(this);
                        var thisId = _this.data('id');
                        var module_id=_this.data('module_id');
                        showModalBox ();
                        getModuleList(module_id);

                        $('#name').val(_this.data('name'));
                        $('#link').val(_this.data('link'));
                        $('#saveSetting').unbind().on('click', function () {
                            $('#saveSetting').attr('disabled', false);

                            var params = $('#modal-form').serialize() + '&id=' + thisId;
                            console.log(params);
                            var updateApi = self.api.API('menu', 'update', params);
                            updateApi.load({
                                success: function (msg, data) {
                                    $('#settingModal').modal('hide');
                                    common.msgs.pop_up('更新成功', 'info');
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
                            var deleteApi = self.api.API('menu', 'deleted', {id: thisId});
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
                getModuleList();
                $('#saveSetting').unbind().on('click', function () {
                    if ($('#name').val().length < 1) {
                        common.msgs.pop_up('名称不能为空', 'error');
                        $('#name').focus();
                        return false;
                    }
                    var params = $('#modal-form').serialize()+'&grade=2';

                    var applyAppApi = self.api.API('menu', 'create', params);

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
            function getModuleList(defaultValue) {
                var theApi = self.api.API('module', 'list');
                theApi.load({
                    success: function(msg, data){
                        if (data !== null) {
                            $("#module_id").html("<option></option>");
                            for (var i=0;i < data.length; i++) {
                                var item = $("<option>").val(data[i].id).text(data[i].name);
                                $("#module_id").append(item);
                            }
                        }
                        defaultValue = defaultValue ? defaultValue : '';
                        $("#module_id").val(defaultValue).trigger('change')
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

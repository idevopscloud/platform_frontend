define(['api', 'common', 'bootstrap'], function (YM, common) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            api: {
                menu: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'menus/nav'},
                logout: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'logout'},
            }
        });
    };
    widget.prototype = $.extend(widget.prototype, {
        init: function () {
            var self = this;
            var menuArr =  [];
            var logoutApi = this.api.API('api', 'logout');
            var menuListApi = self.api.API('api', 'menu');
            var hooks = {
                beforeSend: function(){
                    common.loading.show(self.dom);
                },
                success: function(msg, data){
                    $('#navBar').empty();
                    menuArr = data;
                    $.each(menuArr, function (i, n) {
                        var menuStr = 
                        '<div class="panel panel-default">'+
                            '<div data-url="'+n.url+'" data-alias="'+n.alias+'" data-container="body"  data-toggle="tooltip" data-trigger="hover" data-placement="right" title="'+n.title+'" class="panel-heading" role="tab" id="heading'+i+'">'+
                                '<h4 class="panel-title">'+
                                '<a data-toggle="collapse" data-parent="#navBar" href="#" aria-expanded="true" aria-controls="collapse'+i+'">\
                                <span data-menu="'+ n.alias +'">\
                                    <span class="path1"></span><span class="path2"></span><span class="path3"></span><span class="path4"></span><span class="path5"></span><span class="path6"></span>\
                                </span>\
                                </a></h4></div>\
                            </div>';

                        $('#navBar').append(menuStr);
                    });
                    var urlHash = window.location.hash.split('?');
                    var alias = (urlHash[0].split('/'))[1];
                    var activeNav = $('.panel-heading[data-alias="'+alias+'"]');
                    if(activeNav && activeNav != '') {
                        activeNav.siblings().removeClass('liActive');
                        activeNav.addClass('liActive');
                    }
                    $('[data-toggle="tooltip"]').tooltip();
                    $('#navBar').delegate('.panel-heading', 'click', function() {
                        $('.panel-heading').removeClass('liActive');
                        $(this).addClass('liActive');
                        window.location.href = $(this).attr('data-url');
                    })
                },
                fail: function(msg,data,code){
                    common.msgs.pop_up(msg, 'error');
                },
                ajaxFail : function(msg){
                    common.msgs.pop_up(msg, 'error');
                },
                ajaxComplete: function(textStatus){
                    common.loading.hide(self.dom);
                }
            };
            menuListApi.load(hooks);

            //sign out
            $('#sign-out').on('click', function (e) {
                e.preventDefault();
                logoutApi.load({
                    success : function (msg, data) {
                        localStorage.clear();
                        window.location.href = '/ ';
                    },
                    fail :  function (msg) {
                        common.msgs.pop_up(msg, 'error');
                    }
                })
            })
        },
        dispose : function () {
            
        }
    });

    return widget;
 });

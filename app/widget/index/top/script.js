define(['api', 'common', 'moment'], function (YM, common) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            api: {
                logout: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'logout'},
                mailPower: {type: 'POST', dataType: 'JSON', timeout: 60, url: 'api/integrate/is-mail'},
                showPower: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'api/integrate/show-mail'}
            }
        });
    };
    widget.prototype = $.extend(widget.prototype, {
        init: function () { 
            $('.userPhoto').attr('src', 'http://'+cors_config.api_host+'/'+localStorage.getItem('photo'));
            $('#username').text(localStorage.getItem('nickname'));

            var logoutApi = this.api.API('api', 'logout');
            var mailPowerApi = this.api.API('api', 'mailPower');
            var showPowerApi = this.api.API('api', 'showPower');

            /*showPowerApi.load({
                success : function (msg, data) {
                    var mailSet = data[0].is_mail;
                    if(mailSet == '1'){
                        $($('input[name="sj_new_notify"]')[1]).prop('checked', 'checked');
                    }else{
                        $($('input[name="sj_new_notify"]')[0]).prop('checked', 'checked');
                    }
                },
                fail :  function (msg) {
                    common.msgs.pop_up(msg, 'error');
                }
            })*/

            $('#logout').on('click', function (e) {
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

            $('#mailPower').on('click', function (e) {
                e.preventDefault();
                $('#mailModal').modal('show');
                $('#doMailModal').unbind().on('click', function(){
                    var mailSetData = $('input[name="sj_new_notify"]:checked').val();
                    mailPowerApi.set({choice: mailSetData});
                    mailPowerApi.load({
                        success : function (msg, data) {
                            $('#mailModal').modal('hide');
                        },
                        fail :  function (msg) {
                            common.msgs.pop_up(msg, 'error');
                        }
                    })
                })
            })

        },
        dispose: function () {
        }
    });

    return widget;
 });
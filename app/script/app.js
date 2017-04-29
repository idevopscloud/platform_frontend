define(['api', 'widget', 'common', 'crossroads', 'underscore'], function(YM, widget, common, crossroads, _) {
    'use strict';

    $(function() {
        // define global variables
        window.widgetPool = [];

        window._global = {};

        // define route switch count
        var route_switch_count = 0;

        // define widgets pool
        var widget_basket = [];

        // define widgets for routes
        var widgets = {
            platform: {
                user: [{
                    'class': 'widget-placeholder',
                    'package': 'platform/user'
                }],
                role: [{
                    'class': 'widget-placeholder',
                    'package': 'platform/role'
                }],
                menu: [{
                    'class': 'widget-placeholder',
                    'package': 'platform/menu'
                }],
                module: [{
                    'class': 'widget-placeholder',
                    'package': 'platform/module'
                }],
                api: [{
                    'class': 'widget-placeholder',
                    'package': 'platform/api'
                }],
                audit: [{
                    'class': 'widget-placeholder',
                    'package': 'platform/audit'
                }],
                group: [{
                    'class': 'widget-placeholder',
                    'package': 'platform/group'
                }],
            },
            dashboard: {
                admin: [{
                    'class': 'widget-placeholder',
                    'package': 'dashboard/admin'
                }],
                team: [{
                    'class': 'widget-placeholder',
                    'package': 'dashboard/team'
                }]
            },
            manage: {
                app: [{
                    'class': 'widget-placeholder',
                    'package': 'manage/app/list'
                }],
                app_settings: [{
                    'class': 'widget-placeholder',
                    'package': 'manage/app/settings'
                }],
                caas: [{
                    'class': 'widget-placeholder',
                    'package': 'manage/caas/list'
                }],
                caas_settings: [{
                    'class': 'widget-placeholder',
                    'package': 'manage/caas/settings'
                }],
            },
            app: {
                list: [{
                    'class': 'widget-placeholder',
                    'package': 'app/list'
                }],
                status: [{
                    'class': 'widget-placeholder',
                    'package': 'app/manage/status'
                }],
                deploy: [{
                    'class': 'widget-placeholder',
                    'package': 'app/manage/deploy'
                }],
                monitor: [{
                    'class': 'widget-placeholder',
                    'package': 'app/manage/monitor'
                }],
                build: [{
                    'class': 'widget-placeholder',
                    'package': 'app/manage/build'
                }],
                event: [{
                    'class': 'widget-placeholder',
                    'package': 'app/manage/event'
                }],
                policy: [{
                    'class': 'widget-placeholder',
                    'package': 'app/manage/policy'
                }],
                log: [{
                    'class': 'widget-placeholder',
                    'package': 'app/manage/log'
                }],
                component: [{
                    'class': 'widget-placeholder',
                    'package': 'app/manage/component'
                }],
                //caas 
                caas_status: [{
                    'class': 'widget-placeholder',
                    'package': 'caas/status'
                }],
                caas_hosts: [{
                    'class': 'widget-placeholder',
                    'package': 'caas/hosts'
                }],
                caas_images: [{
                    'class': 'widget-placeholder',
                    'package': 'caas/images'
                }],
            },
            approval: {
                deploy: [{
                    'class': 'widget-placeholder',
                    'package': 'approval/deploy'
                }],
                instance_clean: [{
                    'class': 'widget-placeholder',
                    'package': 'approval/instance_clean'
                }],
                pod_restart: [{
                    'class': 'widget-placeholder',
                    'package': 'approval/pod_restart'
                }]
            },
            request: {
                mime: [{
                    'class': 'widget-placeholder',
                    'package': 'request/mime'
                }],
            },
            account: {
                team: [{
                    'class': 'widget-placeholder',
                    'package': 'account/team'
                }],
                member: [{
                    'class': 'widget-placeholder',
                    'package': 'account/member'
                }],
            },
            image: {
                list: [{
                    'class': 'widget-placeholder',
                    'package': 'image/list'
                }],
            },
            monitor: {
                system: [{
                    'class': 'widget-placeholder',
                    'package': 'monitor/system'
                }],
                team: [{
                    'class': 'widget-placeholder',
                    'package': 'monitor/team'
                }]
            },
            cluster: {
                system: [{
                    'class': 'widget-placeholder',
                    'package': 'cluster/system'
                }],
                team: [{
                    'class': 'widget-placeholder',
                    'package': 'cluster/team'
                }]
            }
        }

        // reset widgets
        var recyle_basket = function() {
            // common.loading.show($('footer'));
            _.each(widget_basket, function(w) {
                w.destroy();
            });
            $('#widgets_goes_here').empty();
            widget_basket = [];
        }

        var get_hash = function() {
            var match = location.href.match(/#(.*)$/);
            return match ? match[0] : '';
        }

        // parse route
        var parse_route = function() {
            var hash = get_hash();
            if (hash == '' || /[#!\/]$/.test(hash)) {
                window.location.href = '/app.html#!/app/list';
            } else {
                crossroads.parse(hash);
            }
        }

        // prevent blank in string transformed to '+'
        var prepare_query = function(obj) {
            if (typeof obj === 'object') {
                for (var key in obj) {
                    if (obj[key]) {
                        if (true === obj[key]) {
                            obj[key] = '';
                        } else if (typeof obj[key] === 'object') {
                            obj[key] = prepare_query(obj[key]);
                        } else {
                            obj[key] = obj[key].replace(/\+/ig, ' ');
                        }
                    }
                }
            }

            return obj;
        }

        // route listener
        var route = crossroads.addRoute('#!/{widget}/:action:/:id::?query:', function(wid, action, id, querystring) {
            var query = id || querystring;
            if (querystring && id) {
                query = {
                    id: id,
                    queryParam: querystring
                };
            }

            recyle_basket();

            // prepare query to correct
            query = prepare_query(query);

            // if widget exist
            if (widgets[wid]) {
                // if wid is array
                if (_.isArray(widgets[wid])) {
                    // if route does not have action
                    $.each(widgets[wid], function(i, n) {
                        $('#widgets_goes_here').append(
                            $('<div>', {
                                'class': n.class,
                                'widget-package': n.package
                            })
                        );
                    });
                } else if (_.isObject(widgets[wid])) {
                    // if is object
                    // if action exist
                    if (widgets[wid][action]) {
                        // if route does have action
                        if (_.isFunction(widgets[wid][action])) {
                            widgets[wid][action]();
                        } else {
                            $.each(widgets[wid][action], function(i, n) {
                                $('#widgets_goes_here').append(
                                    $('<div>', {
                                        'class': n.class,
                                        'widget-package': n.package
                                    })
                                );
                            });
                        }
                    } else {
                        // 404 not found
                        console.log('---------------------------------------');
                        console.log('404: action not found');
                        console.log('---------------------------------------');
                    }
                }

                // load widgets
                $('*[widget-package], *[widget-script], *[widget-style], *[widget-tpl]', '#widgets_goes_here').each(function(index, dom) {
                    // then load other widgets
                    common.loading.show($('main'));
                    var w = new widget(dom, {
                        basePath: 'app/widget/'
                    });
                    widget_basket.push(w);
                    w.create(function() {
                        common.loading.hide($('main'));
                    }, query);
                });
            } else {
                // 404 not found
                console.log('=======================================');
                console.log('404: widget not found');
                console.log('=======================================');
            }
            // common.loading.hide($('footer'));
        })

        // initialize page widgets
        $('*[widget-package],*[widget-script],*[widget-style],*[widget-tpl]').each(function(index, dom) {
            common.loading.show($('main'));
            var w = new widget(dom, {
                basePath: 'app/widget/'
            });
            window.widgetPool.push(w);
            w.create(function() {
                common.loading.hide($('main'));
            });
        });

        var windowNotify = function(data) {
            var icon_url = '/app/theme/default/images/icon-devops-plan140.png';
            var title = 'iDO平台: ';
            var body = '有新的审批，需要您的批复';
            switch (data[0].type) {
                case 'deploy':
                    title += "上线申请";
                    break;
                case 'instance_clean':
                    title += '停止线上实例';
                    break;
                case 'pod_restart':
                    title += '重启线上组件';
                    break;
            }
            if (window.Notification) {
                if (Notification.permission === 'granted') {
                    var notification = new Notification(title, {
                        body: body,
                        icon: icon_url
                    });
                    notification.onclick = function() {
                        notification.close();
                        window.focus();
                        if (window.location.hash != '#!/approval/deploy')
                            window.location.hash = '#!/approval/deploy';
                    };
                } else {
                    Notification.requestPermission();
                };
            } else if (window.webkitNotifications) {
                if (webkitNotifications.checkPermission == 0) {

                    var WebkitNotification = webkitNotifications.createNotification(icon_url, title, body);
                    WebkitNotification.show();
                } else {
                    webkitNotifications.requestPermission();
                }
            } else {
                console.log('你的浏览器不支持此特性，请下载谷歌浏览器试用该功能');
            }
        }

        // add listener on window
        $(window).on('hashchange', function(e) {
            parse_route();
            // count route switch count
            route_switch_count += 1;
            // if the count over 50
            // then reload page to flush memeory
            if (route_switch_count == 51) {
                //window.location.reload();
            }
        });

        setInterval(function() {
            this.api = new YM();
            this.api.API_LIST({
                approval: {
                    list: {
                        type: 'GET',
                        dataType: 'JSON',
                        timeout: 60,
                        url: 'third/app/app/approvals'
                    },
                }
            });
            var apiList = this.api.API('approval', 'list');
            apiList.load({
                success: function(msg, data) {
                    if (data && data.length > 0)
                        windowNotify(data);
                }
            });
        }, 300000);

        // when refresh page
        parse_route();
    });

    //--define ends
});
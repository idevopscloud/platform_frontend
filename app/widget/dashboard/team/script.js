define(['api', 'common', 'echarts'], function (YM, common, echarts) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            user: {
                info: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'v1/user/mime'}
            },
            company: {
                detail: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/account/companies'},
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/account/companies'},
            },
            app: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/app/apps'},
            },
            env: {
                detail: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/app/app/envs'},
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/app/app/envs'},
            },
        });

        this.api.loadHooks = {
            beforeSend: function(){
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
            ajaxFail : function(msg) {
                common.msgs.pop_up(msg, 'error');
            },
            ajaxComplete: function(textStatus){
            }
        }
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function (query) {
            var self = this;
            self.preLoad();
        },
        preLoad: function () {
            var self = this;
            self.getUserInfo();
            self.getEnvs();
            self.getAlert();
        },
        getUserInfo: function() {
            var self = this;
            var userInfoApi = self.api.API('user', 'info');
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                self.getCompany(data.company_id);
                self.getTeamApp(data.company_id);
            };
            hooks.beforeSend = function () {
                common.loading.show($('.panel-dashboard'));
            };
            hooks.ajaxComplete = function () {
                common.loading.hide($('.panel-dashboard'));
            };
            userInfoApi.load(hooks);
        },
        getCompany: function(company_id) {
            var self = this;
            var companyInfoApi = self.api.API('company', 'detail');
            companyInfoApi.apiPath += '/' + company_id;
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                if (data.users) {
                    $('.count-member').html(data.users.length);
                }
            }
            companyInfoApi.load(hooks);
        },
        getEnvs: function() {
            var self = this;
            var envsApi = self.api.API('env', 'list');
            var hooks = $.extend({}, self.api.loadHooks);
            var box = $('#env-box');
            hooks.success = function(msg, data) {
                if (data.envs) {
                    $.each(data.envs, function(_, env){
                        var tr = $('<tr>');
                        tr.append($('<td>').html(env.name));
                        tr.append($('<td>').html('暂时无法获取'));
                        var nodes = self.getEnv(env.id);
                        tr.append($('<td>').html(nodes.length));
                        tr.append($('<td>').html('暂时无法获取'));
                        tr.append($('<td>').html('暂时无法获取'));
                        tr.append($('<td>').html('暂时无法获取'));
                        tr.append($('<td>').html('暂时无法获取'));
                        box.append(tr);
                    });
                }
            };
            hooks.beforeSend = function () {
                common.loading.show($('#env-box'));
            };
            hooks.ajaxComplete = function () {
                common.loading.hide($('#env-box'));
            };
            envsApi.load(hooks);
        },
        getEnv: function(env_id) {
            var self = this;
            var envApi = self.api.API('env', 'list');
            var hooks = $.extend({}, self.api.loadHooks);
            var nodes = [];
            hooks.success = function(msg, data) {
                if (data.nodes && data.nodes.items) {
                    nodes = data.nodes.items;
                }
            }
            envApi.apiPath += '/' + env_id;
            envApi.options.async = false;
            envApi.load(hooks);
            return nodes;
        },
        getTeamNodeGroup: function() {

        },
        getTeamApp: function (company_id) {
            var count = {app:0, instance:0, container:0};
            var self = this;
            var appListApi = self.api.API('app', 'list', {action: 'team', company_id: company_id});
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                if (data.apps) {
                    count.app = data.apps.length;
                    $.each(data.apps, function(_, app) {
                        if (app.instances) {
                            count.instance = app.instances.length;
                            $.each(app.instances, function(_, ins) {
                                if (ins.components) {
                                    count.container += ins.components.length;
                                }
                            });
                        }
                    });
                }
                $('.count-app').html(count.app);
                $('.count-instance').html(count.instance);
                $('.count-container').html(count.container);
            };
            appListApi.load(hooks);
        },
        getAlert: function() {
            var option = {
                tooltip : {
                    trigger: 'axis',
                    axisPointer : {      
                        type : 'shadow'        
                    }
                },
                color: ['#f5f502', '#ca8622','#c23531'],
                legend: {
                    data:['Warning', 'Error', 'Fatal']
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis : [
                    {
                        type : 'category',
                        data : ['周一','周二','周三','周四','周五','周六','周日']
                    }
                ],
                yAxis : [
                    {
                        type : 'value'
                    }
                ],
                series : [ 
                    {
                        name:'Warning',
                        type:'bar',
                        data:[120, 132, 101, 134, 90, 230, 210]
                    },
                    {
                        name:'Error',
                        type:'bar',
                        data:[862, 1018, 964, 1026, 1679, 1600, 1570]
                    },
                    {
                        name:'Fatal',
                        type:'bar',
                        data:[620, 732, 701, 734, 1090, 1130, 1120]
                    },
                ]
            };
            var myChart = echarts.init(document.getElementById('chart-main'));
            myChart.setOption(option);
        },
        bindEvent: function () {
            var self = this;
        },
        dispose : function () {
            
        }

    });

    return widget;
});

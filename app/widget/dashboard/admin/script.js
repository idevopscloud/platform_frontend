define(['api', 'common', 'echarts'], function (YM, common, echarts) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            company: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/account/companies'},
            },
            app: {
                list: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'third/app/apps'},
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
            self.getTeam();
            self.getCluster();
            self.getAlert();
        },
        getTeam: function() {
            var self = this;
            var companyListApi = self.api.API('company', 'list', {action: 'statistics'});
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                var box = $('#team-box').empty();
                $.each(data.data, function(_, company) {
                    var tr = $('<tr>').data('id', company.id);
                    tr.append($('<td>').html(company.name));
                    if (company.users)
                        tr.append($('<td>').html(company.users.length));
                    else
                        tr.append($('<td>').html('暂时无法获取'));
                    tr.append($('<td>').html('暂时无法获取'));
                    var count = self.getTeamApp(company.id);
                    tr.append($('<td>').html(count.app));
                    tr.append($('<td>').html(count.container));

                    box.append(tr);
                });
            };
            hooks.beforeSend = function() {
                common.loading.show($('.table-team'));
            };
            hooks.ajaxComplete = function() {
                common.loading.hide(".table-team");
            };
            companyListApi.load(hooks);
        },
        getTeamNodeGroup: function(){

        },
        getTeamApp: function (company_id) {
            var count = {app:0, container:0};
            var self = this;
            var appListApi = self.api.API('app', 'list', {action: 'team', company_id: company_id});
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                if (data.apps) {
                    count.app = data.apps.length;
                    $.each(data.apps, function(_, app) {
                        if (app.instances) {
                            $.each(app.instances, function(_, ins) {
                                if (ins.components) {
                                    count.container += ins.components.length;
                                }
                            });
                        }
                    });
                }
            };
            appListApi.options.async = false;
            appListApi.load(hooks);
            return count;
        },
        getCluster: function() {

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

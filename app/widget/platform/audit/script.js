define(['api', 'common', 'select2','datetimepicker'], function (YM, common, Ant) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            group: {
                lists: {type: 'GET', dataType: 'JSON', timeout: 60, url: 'api/audit/lists'}
            },
        });
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function () {
            var self = this;
            var tableBox = $('#tableBox');

            // get process list
            var tableListApi = self.api.API('group', 'lists');
            tableListApi.load({
                beforeSend: function(){
                    common.loading.show(self.dom);
                },
                success: function(msg, data){
                    tableBox.empty();
                    listPaginate(data);
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
                            '<td>'+data[i].user_name+'</td>'+
                            '<td>'+data[i].remote_address+'</td>'+
                            '<td>'+data[i].request_path+'</td>'+
                            '<td>'+data[i].request_method+'</td>'+
                            '<td>'+data[i].request_content+'</td>'+
                            '<td>'+data[i].created_at+'</td>'+
                            '</tr>';
                        tableBox.append(str);
                    }

                    $('a[name="link"]').on('click',function(){
                        var tableBox = $('#tableBox');
                        var _this = $(this);
                        var thisPage = _this.data('page');


                        // get process list
                        var ListApi = self.api.API('group', 'lists',{page: thisPage});
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

            function showModalBox () {
                $('input').val('');
                $('#settingModal').modal('show');
            }

            $('.datepicker').datetimepicker({
                format: "yyyy/mm/dd hh:ii:ss",
                autoclose: 1,
                todayBtn: 1,
                pickerPosition: "bottom-left",
                minuteStep: 5,
                minView: 'month'
            });

            $('#filter').on('click', function() {
                var tableBox = $('#tableBox');
                var _this = $(this);
                var thisPage = _this.data('page');
                var post_data={
                    user_name:          $('#user_name').val(),
                    remote_address:     $('#remote_address').val(),
                    request_path :      $('#request_path').val(),
                    request_action  :   $('#request_action').val(),
                    begin_time   :      $('#begin_time').val(),
                    end_time     :      $('#end_time').val(),
                    page:thisPage
                }
                // get process list
                var ListApi = self.api.API('group', 'lists',post_data);
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
            });
        },
        dispose: function () {
        }
    });

    return widget;
});

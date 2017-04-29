function pager(pg,container_head,container_foot,limit,form,btn_id){
	//clear last pager
	if($("div[id^='pager_']")){
		$("div[id^='pager_']").empty();
	}

	
	var containerData = new Array(container_head,container_foot);//format page contanier
	var goToPage = true;//true:ON false:Off

	for(con = 0; con < containerData.length; con++){
		if(containerData[con]){
			var container_top = containerData[con];
			var container = $('<ul>');
			if(pg && pg.pageRange.length > 1)
			{
				var page_range = pg.pageRange.length;
				var pageNow = pg.page;
				var maxPageNum = pg.pageNum;
				if(pg.hasPrevious)
					container.append('<li><a class="btn" name="changePage" page="'+ (pg.page - 1) + '" trans="Prev_page">'+$.i18n.prop('Prev_page')+'</a></li>');
				else
					container.append('<li><a class="btn disabled" href="javascript:void(0);" trans="Prev_page">'+$.i18n.prop('Prev_page')+'</a></li>');

				for(var i = 1; i <= page_range; i++){
					var pg_i = pg.pageRange[i - 1];
					if(pg_i == pageNow){
						container.append('<li class="active"><a href="javascript:void(0);">'+ pg_i +'</a></li>');
					}
					else if(pg_i == '&hellip;')
						container.append('<li class="disabled"><a  href="javascript:void(0);">'+ pg_i +'</a></li>');
					else
						container.append('<li><a name="changePage" page="'+ pg_i + '">'+ pg_i +'</a></li>');
				}

				if(pg.hasNext)
					container.append('<li><a name="changePage"  page="'+ (pg.page * 1 + 1) + '" trans="next_page">'+$.i18n.prop('next_page')+'</a></li>');
				else
					container.append('<li><a class="btn disabled" href="javascript:void(0);" trans="next_page">'+$.i18n.prop('next_page')+'</a></li>');

				
				//go to page numbers
				if(goToPage){
					container.prepend('<li><span><span trans="page"> '+$.i18n.prop('page')+' </span><span> ' + pageNow + ' </span><span trans="of"> '+$.i18n.prop('of')+' </span><span> ' + maxPageNum + '</span></span></li>');
					container_top.append('<select class="form-control offer_limit" name="page_limit"><option value="20" trans="limit2">'+$.i18n.prop('limit2')+'</option><option value="30"  trans="limit3">'+$.i18n.prop('limit3')+'</option><option value="50" trans="limit5">'+$.i18n.prop('limit5')+'</option></select>');
					$("select option", container_top).each(function(i,dom){
						if($(dom).val() == limit){
							$(dom).attr("selected","selected");
						}
					});
				}
			}else{
				container.append('<li class="active"><a data-target="1" href="javascript:void(0);">1</a></li>');

				if(goToPage){
					container_top.append('<select class="form-control offer_limit" name="page_limit"><option value="20" trans="limit2">'+$.i18n.prop('limit2')+'</option><option value="30"  trans="limit3">'+$.i18n.prop('limit3')+'</option><option value="50" trans="limit5">'+$.i18n.prop('limit5')+'</option></select>');
					$("select option", container_top).each(function(i,dom){
						if($(dom).val() == limit){
							$(dom).attr("selected","selected");
						}
					});
				}
			}

			container_top.append(container);

			$("select[name=page_limit]", container_top).change(function(){
				var limit = $(this).val();
                		$('#page').val(1);
				$('#limit').val(limit);

				if(form != null && form != ''){
					form.trigger('submit');
				}else if(btn_id != null && btn_id != ''){
                    $('#'+btn_id).click();
				}
				
			})

            $("a[name='changePage']").unbind().on('click', function(){
                var page = $(this).attr('page');
                $('#page').val(page);

                if(form != null && form != ''){
                    form.trigger('submit');
                }else if(btn_id != null && btn_id != ''){
                    $('#'+btn_id).click();
                }
            });
		}
	}
}

/*
*  新接口的分页前台进行分页，后台只传递总页数与当前页码，此方法用于转换新接口的页码数据
*/
function convertPage(data) {
    var currPage = data.currentpage;//当前页码
    var pageLimit = data.pagesize;//当前总共显示条数
    var currSize = data.total;//当前有多少条数据
    var pageNum = data.totalpage;//总共有多少页
    var showNum = 10;//控制分页长度

    var page = {
        hasNext: false,
        hasPrevious: false,
        page: currPage,
        pageNum: pageNum,
        pageRange: ['1']
    };

    if (page.pageNum > 1) {
        //如果当前第一页
        if (page.page == 1) {
            page.hasNext = true;
            if (pageNum < showNum) {
                for(var i = 0; i < pageNum; i++) {
                    page.pageRange[i] =  i + 1 ;
                }
            } else {
                for(var j = 0; j < showNum - 1; j++) {
                    page.pageRange[j] =  j + 1;
                }

                page.pageRange[8] = '&hellip;';
                page.pageRange.push(pageNum);
            }
        }

        //如果当前中间页
        if (page.page != 1 && page.page != pageNum) {
            page.hasNext = true;
            page.hasPrevious = true;

            if (pageNum < showNum) {
                for(var i = 0; i < pageNum; i++) {
                    page.pageRange[i] =  i + 1 ;
                }
            } else {
                for(var j = 0; j < showNum - 1; j++) {
                    page.pageRange[j] =  j + 1;
                }

                if (page.page < 8) {
                    page.pageRange[8] = '&hellip;';
                }

                if (page.page > page.pageNum - 6) {
                    page.pageRange[1] = '&hellip;';
                    for (var i = 2; i < showNum; i++) {
                        console.log('page.pageNum - showNum + i=%d,\n i=%d', page.pageNum - showNum + i, i);
                        page.pageRange[i] =   page.pageNum - showNum + i + 1;
                    }
                }

                if (page.page >= 8 && page.page <= page.pageNum - 6) {
                    page.pageRange[1] = '&hellip;';
                    page.pageRange[2] = page.page - 2;
                    page.pageRange[3] = page.page - 1;
                    page.pageRange[4] = page.page;
                    page.pageRange[5] = page.page + 1;
                    page.pageRange[6] = page.page + 2;
                    page.pageRange[7] = page.page + 3;
                    page.pageRange[8] = '&hellip;';
                }

                page.pageRange[9] = page.pageNum;
            }
        }

        //如果当前是最末页
        if (page.page == pageNum) {
            page.hasNext = false;
            page.hasPrevious = true;
            if (pageNum < showNum) {
                for(var k = 0; k < pageNum; k++) {
                    page.pageRange[k] =  k + 1 ;
                }
            } else {
                page.pageRange[0] = 1;
                for(var o = 2; o < showNum; o++) {
                    page.pageRange[o] =   page.pageNum - showNum + o;
                }
                page.pageRange[1] = '&hellip;';
                page.pageRange[10] = page.pageNum;
            }
        }
    }

    return page;
}

function pager(data, pageurl, dom, queryParam, urlParams){
    var pageList = '';
    var prevDsb = data.current_page == 1 ? 'class="disabled"' : '';
    var nextDsb = data.current_page == data.last_page ? 'class="disabled"' : '';
    var prevNumber = (data.current_page-1) < 1 ? 1 : (data.current_page-1);
    var nextNumber = (data.current_page+1) >= data.last_page ? data.last_page : (data.current_page+1);
    if(data.last_page > 9){
        if(data.current_page > 4){
            for(var i=data.current_page-4; i<= data.current_page+4 && i<= data.last_page; i++){
                var cls = data.current_page == i ? 'class="active"' : '';
                pageList += '<li '+cls+'><a data-page="'+i+'"> '+i+' </a></li>';
            }
        }else{
            for(var i=1; i<= 9; i++){
                var cls = data.current_page == i ? 'class="active"' : '';
                pageList += '<li '+cls+'><a data-page="'+i+'"> '+i+' </a></li>';
            }
        }
    }else{
        for(var i=1; i<= data.last_page; i++){
            var cls = data.current_page == i ? 'class="active"' : '';
            pageList += '<li '+cls+'><a data-page="'+i+'"> '+i+' </a></li>';
        }
    }

    var prevPage = '<li '+prevDsb+'>'+
            '<a aria-label="Previous" data-page="'+prevNumber+'">'+
            '<span aria-hidden="true">上一页</span>'+
            '</a>'+
            '</li>';

    var nextPage = '<li '+nextDsb+'>'+
            '<a aria-label="Next" data-page="'+nextNumber+'">'+
            '<span aria-hidden="true">下一页</span>'+
            '</a>'+
            '</li>';

    var str = '<ul class="pagination">'+
            prevPage+
            pageList+
            nextPage+
            '</ul>';
    var box = dom || "#pageBox";
    $(box).empty().append(str);
    $('a', box).on('click', function (e) {
        e.preventDefault();
        var liDom = $(this).parent();
        if(!(liDom.hasClass('disabled')) && !(liDom.hasClass('active'))){
            $('li', dom).removeClass('active');
            $(this).parent().addClass('active');
            if(queryParam){
                localStorage.setItem('queryParamGroup', queryParam.group);
                localStorage.setItem('queryParamState', queryParam.state);
            }
            if(!urlParams){
                urlParams = ''
            }
            window.location.hash = pageurl + '?page=' + $(this).data('page') + urlParams + '&_r=' + Math.floor(Math.random() * 100000000000 );
            
        }
    })
}

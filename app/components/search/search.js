/**
 * Created by felix on 14-11-5.
 */
angular.module('search',[]).
    constant('searchConts', {
        searchUrl : 'searchResult.jsp'
    })
    /**
     * 视频搜索。
     */
    .factory('searchServ', ['$http', '$filter', 'searchConts', function($http, $filter, constant){
        var _size=12,
            _keys,
        r={
            busy:false,
            noMore:false,
            loadMore:loadMore,
            load:load
        };
    function loadMore(entities){
        if(_keys.start===undefined || r.noMore){return}
            r.busy=true;
        if(!_keys||_keys.start==undefined||_keys.size==undefined){return}
        $http.get(constant.searchUrl, {params:_keys}).success(function(data){
            if(_keys.videoKind == '正片'){
                data.entities = $filter('filter')(data.entities, {keywords:'!预告花絮'})
            }
            _keys.start+=_keys.size;
            entities.splice.bind(entities, entities.length, 0).apply(null, data.entities);
            r.busy=false;
            if(data.entities.length < _keys.size - 2){
                r.noMore = true;
            }
        }).error(function(){r.busy=false})
    }

    /**
     * 第一次载入数据。
     * @param keys 搜索关键字对象，若指定keys中start则表示可使用loadMore
     * @param [target] 将结果拓展到此对象
     * @returns {*}
     */
    function load(keys, target){
        //指定了start说明是分页，需要保存每次搜索的状态，仅仅对需要分页的保存搜索状态
        keys.size=keys.size || _size;
        if(keys.start!==undefined){
            keys.size=keys.size || _size;
            r.noMore = false;
            r.busy = true;
        }
        return $http.get(constant.searchUrl, {params:keys}).success(function(data){
            if(keys.start!==undefined){
                if(data.entities.length < keys.size - 2){r.noMore=true}
                _keys=keys;
                _keys.start+=_keys.size;
                r.busy=false;
            }
            if(keys.videoKind == '正片'){
                data.entities = $filter('filter')(data.entities, {keywords:'!预告花絮'})
            }
            target && angular.extend(target, data);
        }).error(function(){r.busy=false})
    }

    return r
}])
;
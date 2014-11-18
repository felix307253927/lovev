/**
 * Created by felix on 14-11-13.
 */
angular.module('interact',[])
    .constant('interactConst',{
        collectionDataUrl:"components/interact/collection-data.jsp"
    })
/**
 * 收藏服务 (必须在用户登录后进行载入，退出登录后需要清空)
 */
    .factory('collectionServ', ['$http', '$rootScope','interactConst', function($http, $rootScope, constant){
    var collection=[];
    /**
     * 是否已载入收藏，作为是否要显示取消收藏，收藏的开关
     * @type {boolean}
     */
    var isLoaded=false;

    $rootScope.$on('logout', function(){
        collection.length=0;
    });

    var r = {
        isLoaded:function(){
            return isLoaded
        },
        isCollected:function(contid){
            if(!isLoaded){return -1}
            return collection.some(function(elem){
                return elem.contid == contid
            })
        },
        toggleCollect:function(info){
            if(!isLoaded){return}
            var contid = info.collectionContid || info.contid;
            r.isCollected(contid) ? r.cancelCollect(info.nodeid, contid): r.doCollect(angular.copy(info));//copy info to prevent changes of the arg affecting the source
        },
        doCollect:function(info){
            //如此使得电视剧的检查收藏都用第一集的id来判断，并且还是用contid这一名字
            if(info.collectionContid){
                info.contid = info.collectionContid;
                delete info.collectionContid;
            }
            return $http.get('/add_Favorite.msp', {
                params:{
                    nodeId:info.nodeid,
                    contentId:info.contid
                }
            }).success(function(data){
                if(data.result){
                    collection.unshift(info)
                }
            })
        },
        cancelCollect:function(nodeid, contid){
            return $http.get('/deleteByContNode_Favorite.msp', {
                params:{
                    nodeIds:nodeid,
                    contentIds:contid
                }
            }).success(function(data){
                if(data.result){
                    collection.some(function(elem, i){
                        if(elem.contid == contid){
                            return !!collection.splice(i, 1);
                        }
                    })
                }
            })
        },
        getCollection:function(){
            if(!isLoaded){
                $http.get(constant.collectionDataUrl).success(function(data){
                    collection.splice.bind(collection, 0, 0).apply(null, data.collection);
                    isLoaded = true;
                })
            }
            return collection
        }
    };
    return r;
}]);
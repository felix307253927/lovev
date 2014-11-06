/**
 * Created by felix on 14-11-5.
 */
angular.module('lovevApp.level1',[])
    .constant('level1Const',{
        //放置一些常量
        index:'40114942',
        movie:'40106958',
        drama:'40106959',
        microMovie:'40113154',
        cartoon:'40115236',

        nodeidRE:/^\d{8}$/
    })
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/level1', {
            templateUrl: '/level1.html',
            controller: 'level1Ctrl'
        });
    }])
    .controller('Level1Ctrl', ['$scope', '$rootScope', '$http',
        '$routeParams', 'needRefresh', 'level1Constant', 'dataCache',
        function($scope, $rootScope, $http, $routeParams, needRefresh, constant, dataCache) {
            console.log('level1Ctrl');
            var channel = $routeParams.channel || 'index',
                key, _data;

            function parseRouteOfMore(blocks) {
                blocks.forEach(function (block) {
                    if (block.routeOfMore) {
                        var routeOfMore = block.routeOfMore.trim(), route, level, path, keys = '';
                        route = routeOfMore.split(routeOfMore.indexOf('，') != -1 ? '，' : ',');
                        path = route[0].trim();
                        level = constant.nodeidRE.test(path) ? 'l1' : 'l2';
                        if (route.length > 1) {
                            keys = '/' + route[1].trim()
                        }
                        block.routeOfMore = '#/' + level + '/' + path + keys;
                    }
                })
            }

            channel = /^\d+$/.test(channel) ? channel : constant[channel];
            key = 'level1Ctrl' + channel;
            if (_data = dataCache.get(key)) {//配合首页模板中的数据优化首页的载入速度
                needRefresh(key, _data);
                parseRouteOfMore(_data.blocks);
                dataCache.remove(key);
            }

            if (!needRefresh(key)) {
                angular.extend($scope, needRefresh(key, 'read'));
                //parseRouteOfMore($scope.blocks);
                $rootScope.footerHide = false;
                doSlide();
            } else {
                $http.get('data-level1.jsp' + '?nid=' + channel).success(function (data) {
                    angular.extend($scope, data);
                    parseRouteOfMore($scope.blocks);
                    $rootScope.footerHide = false;
                    needRefresh(key, data);
                    doSlide();
                });
                console.log(key + 'refreshed');
            }
            $scope.$on('$destroy', function () {
                $rootScope.footerHide = true;
            });

            //幻灯片
            function doSlide(){
                setTimeout(function(){
                    slide(document.querySelectorAll('.views-frame').length>1?'.views-frame:last-child ':'','.slideBox','.hd ul','.bd ul')
                },0)
            }
            function slide(prefix,arg1,arg2,arg3){
                TouchSlide({
                    slideCell:prefix+arg1,//".slideBox",
                    titCell:prefix+arg2,//".hd ul", //开启自动分页 autoPage:true ，此时设置 titCell 为导航元素包裹层
                    mainCell:prefix+arg3,//".bd ul",
                    effect:"leftLoop",
                    interTime:5000,
                    autoPlay:true,//自动播放
                    autoPage:true, //自动分页
                    switchLoad:"_src"
                });
            }
        }
    ])
;
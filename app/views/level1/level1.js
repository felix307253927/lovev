/**
 * Created by felix on 14-11-5.
 */
angular.module('level1View',['utils','ngRoute'])
    .constant('level1Const',{
        //放置一些常量
        index:'40114942',
        movie:'40106958',
        drama:'40106959',
        microMovie:'40113154',
        cartoon:'40115236',
        level1DataUrl:'views/level1/level1-data.jsp',

        nodeidRE:/^\d{8}$/
    })
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/level1', {
            templateUrl: 'views/level1/level1-view.jsp',
            controller: 'level1Ctrl'
        });
    }])
    .controller('level1Ctrl', ['$scope', '$rootScope', '$http',
        '$routeParams', 'refreshServ', 'level1Const','dataCacheServ',
        function($scope, $rootScope, $http, $routeParams, refreshServ, constant,dataCache) {
            var channel = $routeParams.channel || 'index',
                key, _data;

            function parseRouteOfMore(blocks) {
                blocks.forEach(function (block) {
                    if (block.routeOfMore) {
                        var routeOfMore = block.routeOfMore.trim(), route, level, path, keys = '';
                        route = routeOfMore.split(routeOfMore.indexOf('，') != -1 ? '，' : ',');
                        path = route[0].trim();
                        level = constant.nodeidRE.test(path) ? 'level1' : 'level2';
                        if (route.length > 1) {
                            keys = '/' + route[1].trim()
                        }
                        block.routeOfMore = '#/' + level + '/' + path + keys;
                    }
                })
            }

            channel = /^\d+$/.test(channel) ? channel : constant[channel];
            key = 'level1Ctrl' + channel;
            if (_data = dataCache.get(key)) {
                refreshServ(key, _data);
                parseRouteOfMore(_data.blocks);
                dataCache.remove(key);
            }
            if (!refreshServ(key)) {
                angular.extend($scope, refreshServ(key, 'read'));
                //parseRouteOfMore($scope.blocks);
                $rootScope.footerHide = false;
                doSlide();
            } else {
                $http.get(constant.level1DataUrl + '?nid=' + channel).success(function (data) {
                    angular.extend($scope, data);
                    parseRouteOfMore($scope.blocks);
                    $rootScope.footerHide = false;
                    refreshServ(key, data);
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
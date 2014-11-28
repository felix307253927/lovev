/**
 * Created by felix on 14-11-5.
 */
angular.module('level2', ['search','utils'])
    .constant('level2Const', {
        index:'70000013',
        movie:'40106958',
        drama:'40106959',
        microMovie:'40113154',
        cartoon:'40115236',
        '最新':'pubTime',
        '最热':'score',
        '评分':'score',
        headName:{movie:'电影',drama:'电视剧',microMovie:'微电影',cartoon:'动漫',free:'限免'}
    })
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/level2/:channel/:keys?/:rank?', {
            templateUrl: 'views/level2/level2-view.jsp',
            controller: 'level2Ctrl'
        });
    }])
    .controller('level2Ctrl', ['$scope', '$routeParams', 'level2Const', 'searchServ', 'dataCacheServ',
        function ($scope, $routeParams, constant, searchServ, dataCache) {
//设置头部名称
            $scope.head = constant.headName[$routeParams.channel] || constant.headName.movie;
//设置默认详情视图的类型
            $scope.detailView = 'img';
            $scope.setView = function (type) {
                $scope.detailView = type
            };

//过滤器选项生成
            $scope.filterKeys = {};
            $scope.filterOrder = [];
            var filterKeys = dataCache.get('filterKeys'), channel = $routeParams.channel;
            for (var filter in filterKeys) {
                var keys = filterKeys[filter][channel];
                if (keys) {
                    $scope.filterKeys[filter] = keys;
//若不抽出filter并按此repeat，angular将按属性名的字典序来repeat对象属性
                    $scope.filterOrder.push(filter);
                    $scope.filterKeys[filter].skey = '全部';
                }
            }
//过滤器选择方法
            $scope.select = function (filter, key) {
                var keys = $scope.filterKeys[filter];
                if (keys.skey == key) {
                    return
                }
                keys.skey = key;
                delete $scope.searchKeys[filter];
                if (key != '全部') {
                    $scope.searchKeys[filter] = key
                }
                $scope.searchKeys.start = 0;
                searchServ.load($scope.searchKeys, $scope)
            };

//排序种类生成
            $scope.ranks = ['最新', '最热', '评分'];
            $scope.ranks.skey = '最新';
//排序方法
            $scope.doRank = function (type) {
                if (type == $scope.ranks.skey) {
                    return
                }
                $scope.ranks.skey = type;
                $scope.searchKeys.rank = constant[type];
                $scope.searchKeys.start = 0;
                searchServ.load($scope.searchKeys, $scope);
            };

//设置发至服务器的搜索词
            $scope.searchKeys = {keyword: $routeParams.channel, rank: constant['最新']};//TODO:路径到id的转换可能放到后端比较合适

            $scope.loadMore = searchServ.loadMore;
            $scope.search = searchServ;

//从路由参数中获取搜索词
            if ($routeParams.keys) {
//根据路由参数中的过滤key，找出对应的过滤器名(顺带选中其下之key)，组成(过滤器名:key)对，置入待传送至服务器的searchKeys中
                $routeParams.keys.split('|').forEach(function (key) {
                    var fk = $scope.filterKeys;
                    for (var filter in fk) {
                        var index = fk[filter].indexOf(key);
                        if (index != -1) {
                            fk[filter].skey = key;
                            if (key != '全部') {
                                $scope.searchKeys[filter] = key
                            }
                            break;
                        }
                    }
                });
            }
            if ($routeParams.rank) {
                $scope.ranks.skey = $routeParams.rank;
                $scope.searchKeys.rank = constant[$routeParams.rank];
            }
//进行搜索,在获取数据后，将数据放到scope
            searchServ.load(angular.extend($scope.searchKeys, {start: 0}), $scope)
        }]);
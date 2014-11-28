/**
 * Created by felix on 14-11-26.
 */
angular.module('searchView', ['search'])
    .config(['$routeProvider',function($routeProvider){
        $routeProvider.when('/search?',{
            templateUrl: 'views/search/search-view.jsp',
            controller : 'searchCtrl'
        })
    }])
    .controller('searchCtrl', ['$scope', '$routeParams', '$location', '$filter', '$timeout', 'searchServ',
        function ($scope, $routeParams, $location, $filter, $timeout, search) {
            $scope.showResult = false;
            var searchHistory = localStorage.getItem('searchHistory'), results = {}, delta = 10;
            searchHistory = searchHistory ? angular.fromJson(searchHistory) : [];
            $scope.searchHistory = searchHistory;
            // 搜索由于存在难以对分页进行分类统计的问题，便采用一次性载入所有搜索结果( < 200)的方法。
            // 然后对此数据进行分析分类，因此这里的加载更多要特殊处理(用size来控制可显示的图片数)
            $scope.size = 15;
            $scope.busy = false;
            $scope.noMore = false;
            $scope.total = 0;

            $scope.select = function (name) {
                $scope.selectedFilter = name;
                $scope.entities = results[name];
            };

            $scope.clearHistory = function () {
                searchHistory.length = 0;
                localStorage.removeItem('searchHistory');
            };

            $scope.loadMore = function () {
                if ($scope.size < $scope.total) {
                    $scope.busy = true;
                    $timeout(function () {
                        $scope.busy = false;
                        $scope.size += delta;
                    }, 1000)
                } else {
                    $scope.noMore = true;
                }
            };

            $scope.search = function (keyword) {
                $location.search('s', keyword);
            };

            if ($routeParams.s) {
                _search($routeParams.s);
            }

            function _search(keyword) {
                $scope.entities = null;
                $scope.total = 0;
                $scope.busy = true;
                $scope.noMore = false;
                $scope.noResult = false;
                $scope.showResult = true;
                addHistory($scope.keyword = keyword);
                search.load({keyword: $scope.keyword, classify: 1}).success(function (data) {
                    if (!data.entities || !data.entities.length) {
                        $scope.noResult = true
                    } else {
                        $scope.classify = data.classify;
                        var filter = $filter('filter'), keys, noMovieKeys, movieKeyIndex;
                        results['全部'] = data.entities;
                        $scope.total = data.entities.length;
                        if ($scope.size >= $scope.total) {
                            $scope.noMore = true;
                        }
                        keys = Object.keys(data.classify);
                        movieKeyIndex = keys.indexOf('电影');
                        noMovieKeys = keys.slice();
                        noMovieKeys.splice(movieKeyIndex, 1);
                        keys.forEach(function (key) {
                            if (key == '全部') {
                                return
                            }
                            if (key == '电影') {
                                results[key] = filter(data.entities, function (value) {
                                    return value.videoKind === ''
                                })
                            } else {
                                results[key] = filter(data.entities, {videoKind: key})
                            }

                        });
                        $scope.select('全部');
                    }
                    $scope.busy = false;
                }).error(function () {
                    $scope.busy = false
                })
            }

            //是否要限制历史记录的长度
            function addHistory(keyword) {
                //正常情况下增加历史记录不会成为耗时操作
                if (searchHistory.indexOf(keyword) == -1) {
                    searchHistory.unshift(keyword);
                    localStorage.setItem('searchHistory', angular.toJson(searchHistory))
                }
            }
        }
    ]);
/**
 * Created by felix on 14-11-10.
 */
angular.module('videoDetailsView',['ngRoute','search','video','utils','interact'])
    .config(['$routeProvider',function($routeProvider){
        $routeProvider.when('/videoDetails/:nodeid/:contid/:view?', {
            templateUrl: 'views/videoDetails/videoDetails-view.jsp',
            controller: 'videoDetailsCtrl'
        });
    }])
    .controller('videoDetailsCtrl', ['$routeParams', '$scope', '$http', '$location', '$route',
        'collectionServ', 'searchServ', 'tipServ', 'authentication', '$filter', 'videoServ',
        function($routeParams, $scope, $http, $location, $route, collectionSrv,
                 search, tipSrv, authentication, $filter, videoSrv){
            var nodeid = $routeParams.nodeid,
                contid = $routeParams.contid,
                startTime = $routeParams.time || 0,
                orderInfo = authentication.getOrderInfo(nodeid, contid),
                detailLoading = true,
                episodeSpanGenerator = $filter('episodeSpanGenerator');

            $scope.viewSelection = 'description';
            $scope.showPlayer = false;
            $scope.collectionContid='';
            $scope.search = search;
            $scope.currentSpan = '';
            $scope.orderProp = 'num';
            $scope.nodeid = nodeid;
            $scope.contid = contid;

            var tried = false;
            $scope.tryPlay = function(){
                if(tried){return}
                tried = true;
                if(orderInfo.authenticating){
                    $scope.$on('authenticated', function(e, id){id == (nodeid+contid) && play()})
                } else play();
            };
            $scope.hasView=function(type){
                return $scope[type] && $scope[type].length>0;
            };
            $scope.setView=function(type){
                $scope.viewSelection = type;
            };
            $scope.changeSpan = function(span){
                $scope.currentSpan = span;
            };
            $scope.changeOrder = function(prop){
                if(prop===undefined){
                    prop = $scope.orderProp == 'num' ? '-num' :'num';
                }
                $scope.orderProp = prop;
            };
            $scope.toggleCollect = collectionSrv.toggleCollect;//detail异步返回,不能在此绑定到toggle
            $scope.isCollectionReady = collectionSrv.isLoaded;
            $scope.isCollected = collectionSrv.isCollected;

            //no need to hold the return value, just trigger loading if not loaded yet
            collectionSrv.getCollection();

            $http.get('views/videoDetails/videoDetails-data.jsp', {
                params:{
                    nodeid:nodeid,
                    contid:contid,
                    presell: $routeParams.isPresell == 'true'
                }
            }).success(function(data){
                angular.extend($scope, data);
                if($scope.episodes && $scope.episodes.length){
                    data.currentEpisode = $scope.episodes.indexOf(contid) + 1;
                    $scope.episodes = $scope.episodes.map(function(e, i){
                        return {num: ++i, contid:e}
                    });

                    if(data.isAnime){
                        var spans = episodeSpanGenerator($scope.episodes.length);
                        spans = spans.map(function(span){
                            var bound = span.split('-');
                            if(!bound.length){
                                bound[0] = parseInt(bound[0]);
                                bound.push(bound[0]);
                            } else {
                                bound[0] = parseInt(bound[0]);
                                bound[1] = parseInt(bound[1]);
                            }
                            return bound;
                        });
                        $scope.episodes.some(function(e, i){
                            if(e.contid == contid){
                                ++i;
                                spans.some(function(span){
                                    if(i >= span[0] && i <= span[1]){
                                        $scope.currentSpan = ''+ span[0] + '-' + span[1];
                                        if(span[0] == span[1]){
                                            $scope.currentSpan = '' + span[0];
                                        }
                                        return true;
                                    }
                                });
                                return true;
                            }
                        })
                    }
                }

                //for collectService & historySrv
                $scope.detail = data;

                //get trailer & clip
                !data.isAnime && search.load({videoKind:'预告', keyword:data.name, size:12}, $scope.trailers={})
                    .success(function(){
                        $scope.trailers = $scope.trailers.entities;
                        $scope.trailers.some(function(trailer, i) {
                            if (trailer.name == $scope.name) {
                                return !!$scope.trailers.splice(i, 1);
                            }
                        })
                    });
                //get recommends
                if(data.isAnime){
                    keyword = 'cartoon'
                } else {
                    keyword = data.totalEpisode ? 'drama' : (data.keywords.indexOf('微电影') != -1 ? 'microMovie' : 'movie');
                }
                //start 参数是开启载入更多的开关
                search.load({keyword:keyword, size:6, type:data.type, start:0}, $scope.recommends={})
                    .success(function(){
                        $scope.recommends = $scope.recommends.entities;
                        $scope.recommends.forEach(function(recommend, i) {
                            if(recommend.name == $scope.name){
                                $scope.recommends.splice(i, 1);
                            }
                        })
                    });
                $scope.loadMoreRecommends =  function(){
                    if($scope.recommends.length<24){
                        search.loadMore($scope.recommends);
                    }else{
                        search.noMore = true;
                    }
                };
                detailLoading = false;
                $scope.$broadcast('detailLoaded')
            });

            if('true' == $routeParams.play){
                $scope.showPlayer = true;
                $scope.$on('authenticated', play)
            }
            if('episodes' == $routeParams.view){
                $scope.viewSelection = 'episodes'
            }

            authentication.authenticate(nodeid, contid);

            function play(){
                if(detailLoading){
                    $scope.$on('detailLoaded', fn)
                }else{
                    fn()
                }

                function fn(){
                    if($scope.noCopyright){
                        tipSrv.showTip({
                            content:'该内容因版权限制，仅限于中国大陆地区播放',
                            confirmText:'返回首页',
                            confirm:'/'
                        })
                    } else if (($scope.isPreSell && !$scope.hasPresold) || !orderInfo.isOrdered) {
                        var argsPath = '/'+nodeid+'/'+contid;
                        $location.path($scope.isLogin ? '/order'+argsPath:'/quickOrder'+argsPath)
                    } else {
                        $scope.showPlayer = true;
                        videoSrv.play(nodeid, contid, orderInfo.playUrl, startTime);
                    }
                }
            }
        }
    ]);

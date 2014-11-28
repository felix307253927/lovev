/**
 * Created by felix on 14-11-21.
 */
angular.module('liveTelecast', [])
    .constant('liveConst', {
        liveTelecastDataUrl: 'views/liveTelecast/liveTelecast-data.jsp',
        livePlayDataUrl : 'views/liveTelecast/livePlay-data.jsp',
        remindReserveUrl: '/remind_reserve.msp',
        removeReserveUrl: '/remove_reserve.msp'
    })
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/liveTelecast', {
            templateUrl: 'views/liveTelecast/liveTelecast-view.jsp',
            controller: 'liveTelecastCtrl'
        }).when('/livePlay/:n/:c?', {
            templateUrl: 'views/liveTelecast/livePlay-view.jsp',
            controller: 'livePlayCtrl'
        })
    }])
    .controller('liveTelecastCtrl', ['$scope', '$http','liveConst', function ($scope, $http, constant) {
        $http.get(constant.liveTelecastDataUrl).success(function (data) {
            $scope.lives = data.lives;
        })
    }])
    .controller('livePlayCtrl', ['$routeParams', '$scope', '$http', '$filter', '$rootScope', '$location', 'authentication', 'videoServ','liveConst',
        function($routeParams, $scope, $http, $filter, $rootScope, $location, authentication, videoSrv, constant) {
            var dateFilter = $filter('date'),
                nodeid, nodeName, programs, todayIndex, reserves, imgSrc, contid, orderInfo;
            nodeid = $scope.nodeid = $routeParams.n;
            contid = $scope.contid = $routeParams.c;
            orderInfo = authentication.getOrderInfo(nodeid, contid);
            $scope.dayIndex = 2;
            $scope.setDayIndex = function(dayIndex) {
                $scope.dayIndex = dayIndex;
            };
            $scope.tryReserve = function(program, event) {
                if (program.status.indexOf('播') != -1) {
                    $location.path('/livePlay/' + nodeid);
                    $location.search({contid: program.contid});
                    console.log('a replay-able or playing program');
                    return;
                }
                //prevent route change
                event.preventDefault();
                console.log('prevent default');
                console.log(program);
                if (!$rootScope.isLogin) {
                    var path = $location.path();
                    $location.path('/loginByPwd');
                    $location.search({returnUrl: path});
                    return
                }
                if (program.status == '预约') {
                    var time = new Date(program.startTime);
                    $http.get(constant.remindReserveUrl,{
                        params: {
                            contentId: program.contid,
                            nodeId: nodeid,
                            nodeName: nodeName,
                            contName: program.name,
                            startTime: dateFilter(time, 'yyyyMMddHHmm')
                        }
                    }).success(function(data) {
                        if (data.result) {
                            program.status = '已预约';
                            reserves.unshift({
                                contid: program.contid,
                                nodeid: nodeid,
                                nodeName: nodeName,
                                name: program.name,
                                imgSrc: imgSrc,
                                startTime: +time
                            })
                        }
                    })
                } else {
                    $http.get(constant.removeReserveUrl,{
                        params: {
                            contentId: program.contid,
                            nodeId: nodeid
                        }
                    }).success(function(data) {
                        if (data.result) {
                            program.status = '预约';
                            reserves.some(function(r, i) {
                                if (r.contid == program.contid) {
                                    reserves.splice(i, 1);
                                    return true;
                                }
                            })
                        }
                    })
                }
            };

            $scope.$on('$routeUpdate', function() {
                var _contid = $routeParams.c;
                if (_contid) {
                    contid = _contid;
                    orderInfo = authentication.getOrderInfo(nodeid, contid);
                    authentication.authenticate(nodeid, contid, 5)
                }
            });

            authentication.authenticate(nodeid, contid, 5);
            $scope.$on('authenticated', function() {
                videoSrv.play(nodeid, contid, orderInfo.playUrl);
            });
            $http.get(constant.livePlayDataUrl + '?n=' +  $routeParams.n).success(function(data) {
                var now = new Date;
                imgSrc = data.imgSrc;
                nodeName = data.nodeName;
                programs = $scope.programs = data.programs;
                todayIndex = $scope.todayIndex = data.todayIndex;
                reserves = $scope.reserves = data.reserves;

                programs.forEach(function(program) {
                    program.forEach(function(p) {
                        if (p.endTime < now) {
                            p.status = '重播';
                        } else if (now < p.startTime) {
                            p.status = reserves.some(function(r) {return r.contid == p.contid}) ? '已预约' : '预约'
                        } else {
                            p.status = '正在播出';
                            p.isLive = true;
                        }
                    });
                });

                if (programs.length != 4) {
                    programs.unshift([],[]);
                    programs.push([]);
                    programs.splice(0, todayIndex);
                    programs.splice(4, 1);
                }
            })
        }
    ]);
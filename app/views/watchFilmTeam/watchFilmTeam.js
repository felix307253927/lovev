/**
 * Created by felix on 14-11-21.
 */
/**
 * 观影团
 */
angular.module('watchFilmTeam', ['utils'])
    .constant('watchFilmTeamConst',{
        joinUrl : '/join_Group.msp',
        dataUrl : 'views/watchFilmTeam/watchFilmTeam-data.jsp'
    })
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/watchFilmTeam/:n?', {
            templateUrl: 'views/watchFilmTeam/watchFilmTeam-view.jsp',
            controller: 'watchFilmTeamCtrl'
        });
    }])
    .controller('watchFilmTeamCtrl', ['$scope', '$http', '$rootScope', 'tipServ','watchFilmTeamConst',
    function($scope, $http, $rootScope, tipSrv,constant){
        var nodeid = $routeParams.n || '';
        $http.get(constant.dataUrl + "?n=" + nodeid).success(function(data){
            if(data){
                angular.extend($scope, data);
            }
        });
        $scope.join = function(){
            if($rootScope.isLogin){
                $http.get(constant.joinUrl + '?activityId=' + $scope.activityId).
                    success(function(data){
                        if(data.result){
                            tipSrv.showTip({
                                confirmText:"返回观影团",
                                content:"您已经成功提交参团请求，如您抢票成功，系统将在抢" +
                                "票活动结束后5个工作日发送提示短信到您手机"
                            })
                        }else if(data.resultCode=="03"){
                            tipSrv.showTip({
                                status:false,
                                confirmText:"返回观影团",
                                content:"当天已参加活动，不能再次参加"
                            })
                        }else if(data.resultCode=="02"){
                            tipSrv.showTip({
                                status:false,
                                confirm:'/order/'+$scope.nodeid+'/'+$scope.contid + '/watchFilmTeam',
                                confirmText:"立即订购",
                                content:"对不起，您尚未订购和视界包月产品，您需要先订购包月产品才能参加本次活动。",
                                cancelText:"取消"
                            })
                        }
                    })
            }else{
                tipSrv.showTip({
                    status:false,
                    confirm:"/loginByPwd/watchFilmTeam",
                    confirmText:"登录账号",
                    content:"您尚未登录，请先登录和视界",
                    cancelText:"返回"
                })
            }
        }
    }
]);
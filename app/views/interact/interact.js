/**
 * Created by felix on 14-11-26.
 */
angular.module('interactView',[])
    .config(['$routeProvider',function($routeProvider){
        [
            ['/downLoad','views/interact/downLoad-view.jsp'],
            ['/tip','views/interact/tip-view.jsp','tipCtrl'],
            ['/feedback','views/interact/feedback-view.jsp','feedbackCtrl'],
            ['/about','views/interact/about-view.jsp'],
            ['/email','views/interact/email-view.jsp']
        ].reduce(function(rp, el){
            var route = {templateUrl:el[1]};
            if(el[2]) {
                route.controller = el[2];
            }
            return rp.when(el[0],route);
        },$routeProvider);
    }])
/**
 * 窗口提示
 */
    .controller('tipCtrl', ['$scope', 'tipServ', function ($scope, tipServ) {
        angular.extend($scope, tipServ.data);
    }])
/**
 * 意见反馈
 */
    .controller('feedbackCtrl', ['$scope', '$http', function($scope, $http){
        var titles={
            '播放问题':1,
            '缓存失败':1,
            '异常退出':1,
            '播放记录不符':1,
            '建议':2,
            '其他':5
        };
        $scope.titles=Object.keys(titles);
        $scope.info = '提交问题';
        $scope.problem={title:'其他'};

        $scope.showResult=false;

        $scope.submit = function(){
            $scope.sumbitDisabled = true;
            $http.post('/feedback.msp', null, {
                params:{
                    suggestTitle:$scope.problem.title,
                    suggestContent:$scope.content,
                    infoType:titles[$scope.problem.title],
                    email:$scope.contact||''
                }
            }).success(function(data){
                $scope.submitResult = data.result;
                $scope.showResult=true;
                $scope.sumbitDisabled =false;
            }).error(function(){
                $scope.submitResult=false;
                $scope.showResult=true;
                $scope.submitDisabled=false;
            })
        }
    }
]);
/**
 * Created by felix on 14-11-5.
 */
angular.module('lovev.level2',[])
    .constant('level2Constant',{
        //放置一些常量
    })
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/level2', {
            templateUrl: '/level2.html',
            controller: 'level2Ctrl'
        });
    }])
    .controller('level2Ctrl',[function(){

    }])
;
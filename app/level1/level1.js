/**
 * Created by felix on 14-11-5.
 */
angular.module('lovev.level1',[])
    .constant('level1Constant',{
        //放置一些常量
    })
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/level1', {
            templateUrl: 'level1/level1.html',
            controller: 'level1Ctrl'
        });
    }])
    .controller('level1Ctrl',[function(){

    }])
;
/**
 * Created by felix on 14-11-25.
 */

angular.module('login',['user','utils'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/loginByPwd/:returnUrl?', {
            templateUrl: 'views/login/loginByPwd-view.jsp',
            controller: 'loginByPwdCtrl'
        }).when('/loginByMsg/:returnUrl?', {
            templateUrl: 'views/login/loginByMsg-view.jsp',
            controller: 'loginByMsgCtrl'
        })
    }])
/**
 * 密码登录页控制器
 */
    .controller('loginByPwdCtrl', ['$rootScope', '$scope', '$http', '$location', '$timeout', '$routeParams', 'constant', 'userServ',
    function($rootScope, $scope, $http, $location, $timeout, $routeParams, constant, userServ){
        var submitDisabled = false;

        $scope.loginInfo = '立即登录';
        $scope.mobileRE = constant.mobileRE;
        $scope.pwdRegisterRE = constant.pwdRegisterRE;
        $scope.captchaRE = constant.captchaRE;
        $scope.mobileErr = $scope.passwordErr = $scope.captchaErr = false;
        $scope.returnUrl = $routeParams.returnUrl;
//图形验证码的随机串
        $scope.captchaSrc = 0;
        $scope.refreshCaptcha = function(){
            $scope.captchaSrc = Math.random()
        };
        $scope.isInvalid=function(){
            return submitDisabled ||
                    //如果form的无效仅仅是密码验证错误所引起的，仍然可以提交表单，以下列举所有无效表达式
                !!($scope.form.$error.required || $scope.form.mobile.$invalid || $scope.form.captcha.$invalid);
        };

        $scope.submit =function(){
            var password = $scope.password;
            //若密码验证无效，则通过viewValue来获取password值
            if("undefined" == typeof password ){
                //之所以引用0，是因为前面的验证保证了只有在密码验证失效时也可提交
                password = $scope.form.$error.pattern[0].$viewValue;
            }
            $scope.loginInfo = '登录中..';
            submitDisabled = true;
            $http.post('/login_Account.msp', {
                msisdn:$scope.mobile,
                password:password,
                veriCode:$scope.captcha.replace(/\s/g, '')
            },{transformRequest: constant.transformPostRequest}).success(function(data){
                if(data.result){
                    $scope.loginInfo = '登录成功！';
                    $rootScope.isLogin = true;
                    $rootScope.userInfo = {mobile:$scope.mobile};
                    userServ.requestUserInfo(true);
                    $timeout(function(){
                        $location.path($routeParams.returnUrl || '/l1');
                    }, 1000)
                }else{
                    //TODO:增加登录失败的错误提示，并设置mobileErr或者其他Err
                    $scope.loginInfo = data.message;
                    $timeout(function(){
                        $scope.loginInfo = '立即登录';
                        submitDisabled = false
                    }, 2000)
                }
            }).error(function(){
                submitDisabled=false;
                $scope.loginInfo = '重新登录';
            })
        }
    }
])
/**
 *手机验证码登录的控制器
 */

.controller('loginByMsgCtrl',['$rootScope','$scope','$http','$location','$timeout','$routeParams','constant','userServ','getSMSCodeServ',
    function($rootScope,$scope,$http,$location,$timeout,$routeParams,constant,userServ,getSMSCode){
        $scope.captchaSrc= 0;
        $scope.loginInfo = '立即登录';
        $scope.submitDisabled = false;
        $scope.SMSbtnInfo = '获取验证码';

        $scope.mobileRE = constant.mobileRE;
        $scope.captchaRE=constant.captchaRE;
        $scope.SMSCodeRE = constant.SMSCodeRE;
        $scope.mobileErr = $scope.captchaErr= $scope.SMSCodeErr =  false;
        $scope.returnUrl = $routeParams.returnUrl;

        $scope.getSMSCode= function(){
            if($scope.form.captcha.$invalid){
                $scope.captcha="";
            }else{
                getSMSCode($scope);
            }
        };
        $scope.refreshCaptcha=function(){
            $scope.captchaSrc=Math.random()
        };

        $scope.submit =function(){
            $scope.loginInfo = '登录中..';
            $scope.submitDisabled = true;
            $http.post("/loginByMobile_Account.msp",null,{
                params:{
                    msisdn:$scope.mobile,
                    dynCode:$scope.SMSCode
                }
            }).success(function(data){
                if(data.result){
                    $scope.loginInfo = '登录成功！';
                    $rootScope.isLogin = true;
                    $rootScope.userInfo = {mobile:$scope.mobile};
                    userServ.requestUserInfo(true);
                    $timeout(function(){
                        $location.path($routeParams.returnUrl || '/l1');
                    },1000)
                }else{
//TODO:增加登录失败的错误提示，并设置mobileErr或者其他Err
                    $scope.loginInfo = data.message;
                    $timeout(function(){
                        $scope.loginInfo = '立即登录';
                        $scope.submitDisabled = false
                    },2000)
                }
            }).error(function(){
                $scope.submitDisabled=false;
                $scope.loginInfo = '重新登录';
            })
        }
    }
]);
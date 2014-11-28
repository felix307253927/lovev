/**
 * Created by felix on 14-11-26.
 */
angular.module('register', ['utils'])
    .config(['$routeProvider',function($routeProvider){
        $routeProvider.when('/register/:returnUrl?',{
            templateUrl :'views/register/register-view.jsp',
            controller : 'registerCtrl'
        })
    }])
/**
 * 注册
 */
    .controller('registerCtrl', ['$rootScope', '$scope', '$http', '$location', '$timeout', 'constant', 'getSMSCodeServ',
        function ($rootScope, $scope, $http, $location, $timeout, constant, getSMSCode) {
            $scope.captchaSrc = 0;
            $scope.mobileErr = $scope.captchaErr = $scope.SMSCodeErr = $scope.submitDisabled = $scope.SMSDisabled = false;
            $scope.mobileRE = constant.mobileRE;
            $scope.captchaRE = constant.captchaRE;
            $scope.pwdRegisterRE = constant.pwdRegisterRE;
            $scope.SMSCodeRE = constant.SMSCodeRE;
            $scope.isAgreed = true;
            $scope.SMSbtnInfo = '获取验证码';
            $scope.registerInfo = '立即注册';
            $scope.getSMSCode = function () {
                if ($scope.form.captcha.$invalid) {
                    $scope.captcha = '';
                } else {
                    getSMSCode($scope);
                }
            };
            $scope.refreshCaptcha = function () {
                $scope.captchaSrc = Math.random()
            };

            $scope.submit = function () {
                $scope.registerInfo = '注册中..';
                $scope.sumbitDisabled = true;
                $http.post('/register_Account.msp', null, {
                    params: {
                        msisdn: $scope.mobile,
                        password: $scope.password,
                        dynCode: $scope.SMSCode
                    }
                }).success(function (data) {
                    if (data.result) {
                        $scope.registerInfo = '注册成功';
                        $timeout(function () {
                            $location.path('/l1')
                        }, 1000);
                    } else {
                        $scope.registerInfo = data.message || '注册失败';
                        $timeout(function () {
                            $scope.registerInfo = '立即注册';
                            $scope.sumbitDisabled = false;
                        }, 1000)
                    }
                })
            }
        }
    ]);
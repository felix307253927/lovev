/**
 * Created by felix on 14-11-24.
 */
/**
 * 快速订购
 */
angular.module('order', ['utils', 'video', 'user'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/quickOrder/:nodeid/:contid/:returnUrl?', {
            templateUrl: 'views/order/quickOrder-view.jsp',
            controller: 'quickOrderCtrl'
        }).when('/order/:nodeid/:contid/:returnUrl?', {
            templateUrl: 'views/order/order-view.jsp',
            controller: 'orderCtrl'
        })
    }])
    .controller('quickOrderCtrl', ['$rootScope', '$routeParams', '$scope', '$http', '$timeout', '$location',
        'constant', 'getSMSCodeServ', 'userServ', 'authentication',
        function ($rootScope, $routeParams, $scope, $http, $timeout, $location, constant, getSMSCode, userServ, authentication) {
            var nodeid = $routeParams.nodeid,
                contid = $routeParams.contid,
                orderInfo = authentication.getOrderInfo(nodeid, contid),
                returnUrl = $routeParams.returnUrl;

            //图形验证码的随机串
            $scope.captchaSrc = 0;
            $scope.mobileErr = $scope.captchaErr = $scope.SMSCodeErr = $scope.submitDisabled = $scope.SMSDisabled = false;
            $scope.mobileRE = constant.mobileRE;
            $scope.captchaRE = constant.captchaRE;
            $scope.SMSCodeRE = constant.SMSCodeRE;
            $scope.isAgreedMonth = $scope.isAgreedTime = true;
            $scope.SMSbtnInfo = '获取验证码';
            $scope.confirmInfo = '确认购买';

            $scope.isAuthenticated = function () {
                return orderInfo.authenticating === false
            };
            $scope.isMonth = function () {
                return orderInfo.price.indexOf('次') == -1 && !orderInfo.isPresell
            };
            $scope.getPrice = function () {
                return orderInfo.price.split('.')[0] * orderInfo.discount
            };
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
                var orderMsp = orderInfo.isPresell ? '/preSellOrder_preSell.msp' : '/playByMobile.msp';
                $scope.confirmInfo = '正在处理..';
                $scope.submitDisabled = true;
                $http.post(orderMsp, null, {
                    params: {
                        msisdn: $scope.mobile,
                        dynCode: $scope.SMSCode,
                        nodeId: nodeid,
                        contentId: contid,
                        productID: orderInfo.productID,
                        subType: 1
                    }
                }).success(function (data) {
                    var maskMobile = ($scope.mobile) || '';
                    if (maskMobile.length == 11) {
                        maskMobile = maskMobile.substr(0, 3) + '****' + maskMobile.substr(7, 4);
                    }
                    if (data.result === 'true' || data.result === true) {
                        $scope.confirmInfo = '订购成功';
                        if (!$rootScope.isLogin) {
                            $rootScope.isLogin = true;
                            $rootScope.userInfo = {mobile: $scope.mobile};
                            userServ.requestUserInfo(true);
                        }
                        if (orderInfo.isPresell) {
                            tipSrv.showTip({
                                content: '恭喜您，' + maskMobile + '预订成功',
                                confirmText: '确认',
                                confirm: '/videoDetail/' + nodeid + '/' + contid,
                                detail: '感谢您对和视界的支持，您已经成功预订《' + orderInfo.presellInfo.name +
                                '》影片，系统将在该片上映前1日向您订购手机发送观看提示，欢迎您及时登录和视界，观看最新大片'
                            });
                            return;
                        }
                        $timeout(function () {
                            $location.path(returnUrl || ('/videoDetail/' + nodeid + '/' + contid));
                            $location.search({play: 'true', isOrdered: 'true'});
                        }, 1000)
                    } else {
                        if (orderInfo.isPresell) {
                            tipSrv.showTip({
                                content: '很遗憾，' + maskMobile + '信息提交有误，请重新预订',
                                confirmText: '返回预订'
                            });
                            return;
                        }
                        $scope.orderInfo = data.message;
                        $timeout(function () {
                            $scope.confirmInfo = '确认购买';
                            $scope.sumbitDisabled = false;
                        }, 2000)
                    }
                })
            };

            //若未订购直接返回页面，则需要去掉直接播放参数以免进入“订购--播放”死循环
            $scope.$on('$routeChangeStart', function (_, next, last) {
                //TODO:bad practice, writing hard code 'VideoDetail' which is the name of Controller
                if (last && last.params.isOrdered !== "true" && next.controller == "VideoDetail") {
                    delete next.params.play;
                }
            });
            if ($scope.isAuthenticated()) {
                $scope.isAgreedMonth = $scope.isAgreedTime = true;
            } else {
                authentication.authenticate(nodeid, contid);
                $scope.$on('authenticated', function (e, id) {
                    if (id == nodeid + contid) {
                        $scope.isAgreedMonth = $scope.isAgreedTime = true;
                    }
                })
            }
        }
    ])
/**
 * 订购
 */
    .controller('orderCtrl', ['$rootScope', '$routeParams', '$scope', '$http', '$timeout', '$location',
        'constant', 'authentication', 'tipServ',
        function ($rootScope, $routeParams, $scope, $http, $timeout, $location, constant, authentication, tipSrv) {
            var nodeid = $routeParams.nodeid,
                contid = $routeParams.contid,
                orderInfo = authentication.getOrderInfo(nodeid, contid),
                returnUrl = $routeParams.returnUrl;

            $scope.captchaSrc = 0;
            $scope.captchaErr = false;
            $scope.captchaRE = constant.captchaRE;
            $scope.confirmInfo = '确认购买';

            $scope.isAuthenticated = function () {
                return orderInfo.authenticating === false
            };
            $scope.isMonth = function () {
                return (orderInfo.price.indexOf('次') == -1) && !orderInfo.isPresell
            };
            $scope.getPrice = function () {
                return (orderInfo.price.split('.')[0] * orderInfo.discount) || ''
            };
            $scope.refreshCaptcha = function () {
                $scope.captchaSrc = ++$scope.captchaSrc
            };

            $scope.submit = function () {
                var orderMsp = orderInfo.isPresell ? '/preSellOrder_preSell.msp' : '/add_Order.msp';
                $scope.confirmInfo = '正在处理..';
                $scope.submitDisabled = true;
                $http.post(orderMsp, null, {
                    params: {
                        nodeId: nodeid,
                        contentId: contid,
                        productID: orderInfo.productID,
                        veriCode: $scope.captcha.replace(/\s/g, ''),
                        subType: 1
                    }
                }).success(function (data) {
                    var maskMobile = ($scope.userInfo && $scope.userInfo.mobile) || '';
                    if (maskMobile.length == 11) {
                        maskMobile = maskMobile.substr(0, 3) + '****' + maskMobile.substr(7, 4);
                    }
                    if (data.result === 'true' || data.result === true) {
                        if (orderInfo.isPresell) {
                            tipSrv.showTip({
                                content: '恭喜您，' + maskMobile + '预订成功',
                                confirmText: '确认',
                                confirm: '/videoDetail/' + nodeid + '/' + contid,
                                detail: '感谢您对和视界的支持，您已经成功预订《' + orderInfo.presellInfo.name +
                                '》影片，系统将在该片上映前1日向您订购手机发送观看提示，欢迎您及时登录和视界，观看最新大片'
                            });
                            return;
                        }
                        $scope.confirmInfo = '订购成功';
                        $timeout(function () {
                            $location.path(returnUrl || ('/videoDetail/' + nodeid + '/' + contid))
                            $location.search({play: 'true', isOrdered: 'true'});
                        }, 1000)
                    } else {
                        if (orderInfo.isPresell) {
                            tipSrv.showTip({
                                content: '很遗憾，' + maskMobile + '信息提交有误，请重新预订',
                                confirmText: '返回预订'
                            });
                            return;
                        }
                        $scope.confirmInfo = data.message;
                        $timeout(function () {
                            $scope.confirmInfo = '确认购买';
                            $scope.sumbitDisabled = false;
                        }, 3000)
                    }
                })
            };

            $scope.$on('$routeChangeStart', function (_, next, last) {
                //TODO:bad practice, writing hard code 'VideoDetail' which is the name of Controller
                if (last && last.params.isOrdered !== "true" && next.controller == "VideoDetail") {
                    delete next.params.play;
                }
            });
            if ($scope.isAuthenticated()) {
                $scope.isAgreedMonth = $scope.isAgreedTime = true;
            } else {
                authentication.authenticate(nodeid, contid);
                $scope.$on('authenticated', function (e, id) {
                    if (id == (nodeid + contid)) {
                        $scope.isAgreedMonth = $scope.isAgreedTime = true;
                    }
                })
            }
        }
    ]);
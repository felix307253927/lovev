/**
 * Created by felix on 14-11-25.
 */
angular.module('userCenter', ['utils', 'interact', 'video'])
    .constant('centerConst',{
        orderDataUrl : 'views/userCenter/order-data.jsp',
        presellDataUrl:'views/userCenter/presell-data.jsp'
    })
    .config(['$routeProvider', function ($routeProvider) {
        //route setting , [appPath,    resourcePath,    controller,   reloadOnSearch]
        [
            ['/czCardrecharge', 'views/userCenter/czCardRecharge-view.jsp', 'czCardRechargeCtrl'],
            ['/dbqrecharge', 'views/userCenter/dbqRecharge-view.jsp', 'dbqRechargeCtrl'],
            ['/lpCardrecharge', 'views/userCenter/lpCardRecharge-view.jsp', 'lpCardRechargeCtrl'],
            ['/myAccount', 'views/userCenter/myAccont-view.jsp', 'myAccountCtrl'],
            ['/rechargeFailed', 'views/userCenter/rechargeFailed-view.jsp', 'rechargeFailedCtrl'],
            ['/rechargeSuccess', 'views/userCenter/rechargeSuccess-view.jsp', 'rechargeSuccessCtrl'],
            ['/activeFailed', 'views/userCenter/activeFailed-view.jsp', 'activeFailedCtrl'],
            ['/activeSuccess', 'views/userCenter/activeSuccess-view.jsp', 'activeSuccessCtrl'],
            ['/setting', 'views/userCenter/setting-view.jsp'],
            ['/updatePassword', 'views/userCenter/updatePassword-view.jsp', 'updatePasswordCtrl'],
            ['/userCenter/:nav?', 'views/userCenter/userCenter-view.jsp', 'userCenterCtrl']
        ].reduce(function (rp, elem) {
                var route = {templateUrl: elem[1]};
                if (elem[2]) {
                    route.controller = elem[2]
                }
                return rp.when(elem[0], route)
            }, $routeProvider);
    }])
/**
 * 个人中心控制器，TODO：$rootScope中应包含用户个人信息userInfo:{nickName, account}以及一个会频繁用到isLogin(可能要定时更新)
 */
    .controller('userCenterCtrl', ['$rootScope', '$scope', '$http', '$routeParams',
        'collectionServ', 'historyServ', 'tipServ','centerConst',
        function ($rootScope, $scope, $http, $routeParams, collectionServ, historyServ, tipServ,centerConst) {
            $scope.viewSelection = $routeParams.nav || 'order';
            $scope.nameEditStatus = 'done';
            $scope.editingName = $rootScope.isLogin ? $rootScope.userInfo.nickName : '';
            $scope.editName = function () {
                $scope.nameEditStatus = 'editing';
                //ensure the same
                $scope.editingName = $rootScope.userInfo.nickName;
            };

            $scope.editDone = function () {
                if ($scope.editingName && $rootScope.userInfo.nickName != $scope.editingName) {
                    $http.get('/update_User.msp', {params: {sname: $scope.editingName}})
                        .success(function (data) {
                            if (data.result) {
                                $scope.userInfo.nickName = $scope.editingName;
                            } else {
                                alert(data.message || '用户名更新失败');
                            }
                            $scope.nameEditStatus = 'done'
                        })
                } else {
                    $scope.nameEditStatus = 'done';
                }
            };

            $scope.setView = function (view) {
                if (view == $scope.viewSelection) {
                    return
                }
                $scope.viewSelection = view;
            };
            $scope.cancelOrder = function (productId, name, price, isMonth) {
                tipServ.showTip({
                    confirmText: '确认',
                    status: undefined,
                    cancelText: '返回',
                    contentCssClass: 'common-tip-p',
                    content: '您订购的是' + name + '，' + price + '元/' + (isMonth ? '月' : '次') +
                    '，您确定退订吗？',
                    confirm: function () {
                        $http.get('/cancel_Order.msp', {params: {productId: productId}}).
                            success(function (data) {
                                if (data.result) {
                                    $scope.orders.some(function (order, i) {
                                        if (order.productId == productId) {
                                            $scope.orders.splice(i, 1)
                                        }
                                    });
                                    $rootScope.$broadcast('cancelOrder');
                                    $rootScope.back();
                                }
                            })
                    }
                })
            };
            $scope.cancelCollect = function (event, nodeid, contid) {
                event.preventDefault();
                collectionServ.cancelCollect(nodeid, contid)
            };

            if (!$rootScope.isLogin) {
                $scope.$on('userInfoUpdated', function (_, isLogin) {
                    isLogin && fn();
                })
            } else {
                fn();
            }

            function fn() {
                $http.get(centerConst.orderDataUrl).success(function (data) {
                    angular.extend($scope, data)
                });
                $http.get(centerConst.presellDataUrl).success(function (data) {
                    angular.extend($scope, data)
                });
                //TODO:这里要使用加载更多，放在这里只是临时，或待考虑
                $scope.collection = collectionServ.getCollection();
                angular.extend($scope, {
                    todayHistory: historyServ.todayHistory,
                    serverHistory: historyServ.serverHistory,
                    historyStatus: historyServ.status,
                    deleteHistory: historyServ.deleteHistory,
                    loadHistory: historyServ.loadHistory
                });
                if (!historyServ.status.noMore) historyServ.loadHistory();
            }
        }
    ])
    .controller('myAccountCtrl', ['$scope', '$http', '$routeParams',
        function ($scope, $http, $routeParams) {
            console.log('myAccountCtrl');
            $http.get('/query_Ticket.msp').success(function (data) {
                if (data.result == true) {
                    $scope.dbqBalance = formatQueryMoney(data.filmTickets.usableFilmTicketValue);
                } else {
                    console.log('余额查询失败！');
                }
            });
            $http.get('/qryCardM_Movie.msp').success(function (data) {
                if (data.result == true) {
                    $scope.czkBalance = formatQueryMoney(data.card_m);
                } else {
                    console.log('余额查询失败！');
                }
            });
            function formatQueryMoney(money, hasSign) {
                if (money == 0) return '0';
                hasSign = (hasSign === undefined) ? false : hasSign;
                var _money = parseFloat(money) / 100;
                if (hasSign && _money > 0) {
                    _money = '+' + _money;
                } else {
                    _money = '' + _money;
                }
                var tmpArray = _money.split('.');
                if (tmpArray.length == 1) return _money + '.00';
                tmpArray[1] = tmpArray[1].substr(0, 2);
                tmpArray[1].length == 1 && (tmpArray[1] += '0');
                return tmpArray.join('.');
            }
        }
    ]).
/**
 * 点播券充值控制器
 */
    controller('dbqRechargeCtrl', ['$scope', '$rootScope', '$http', '$location', 'constant',
        function ($scope, $rootScope, $http, $location, constant) {
            $scope.rechargeInfo = '立即充值';
            $scope.submitDisabled = false;
            $scope.dbqpassword = "";

            $scope.mobile = $rootScope.userInfo && $rootScope.userInfo.mobile;
            $scope.mobileRE = constant.mobileRE;
            $scope.dbqCodeRE = constant.dbqCodeRE;

            $scope.submit = function () {
                $scope.rechargeInfo = '充值中..';
                $scope.submitDisabled = true;
                $http.post('/add_Ticket.msp', null, {
                    params: {
                        msisdn: $scope.mobile,
                        passCard: $scope.dbqpassword
                    }
                }).success(function (data) {
                    if (data.result == true) {
                        console.log('点播券充值成功！');
                        //如果充值成功就跳转到充值成功的页面
                        $rootScope.validCount = data.validCount;
                        $location.path("/rechargeSuccess");
                    } else {
                        console.warn('点播券充值失败，resultCode:' + data.resultCode);
                        //如果充值失败就跳转到充值成功的页面
                        $location.path("/rechargeFailed");
                    }
                })
            }
        }
    ]).
/**
 * 充值卡充值的控制器
 */
    controller('czCardRechargeCtrl', ['$rootScope', '$scope', '$http', '$location', 'constant',
        function ($rootScope, $scope, $http, $location, constant) {
            $scope.rechargeInfo = '立即充值';
            $scope.submitDisabled = false;

            $scope.czkCodeRE = constant.czkCodeRE;
            $scope.czkPasCodeRE = constant.czkPasCodeRE;
            $scope.captchaRE = constant.captchaRE;

            //for test
            $scope.formValid = false;

            $scope.czkCodeErr = false;
            $scope.passwordErr = false;
            $scope.captchaErr = false;

            //图形验证码的随机串
            $scope.captchaSrc = 0;

            $scope.submit = function () {
                $scope.rechargeInfo = '充值中..';
                $scope.submitDisabled = true;
                $http.post("/addCard_Movie.msp", null, {
                    params: {
                        cardId: $scope.czCard,
                        cardPwd: $scope.czPassword,
                        veriCode: $scope.captcha
                    }
                }).success(function (data) {
                    if (data.result == true) {
                        console.log('充值卡充值成功！');
                        //如果充值成功就跳转到充值成功的页面
                        $rootScope.validCount = data.validCount;
                        $location.path("/rechargeSuccess");
                    } else {
                        console.warn('充值卡充值失败，resultCode:' + data.resultCode);
                        //如果充值失败就跳转到充值成功的页面
                        $rootScope.czCardInfo = data.message;
                        $location.path("/rechargeFailed");
                    }
                }).error(function () {
                    $scope.submitDisabled = false
                })
            }
        }
    ]).
/**
 * 礼品卡充值的控制器
 */
    controller('lpCardRechargeCtrl', ['$scope', '$rootScope', '$http', '$location', 'constant',
        function ($scope, $rootScope, $http, $location, constant) {
            $scope.rechargeInfo = "立即激活";

            $scope.mobile = $rootScope.userInfo.mobile;
            $scope.lpCodeRE = constant.lpCodeRE;

            $scope.formValid = false;
            $scope.passwordErr = false;

            $scope.submit = function () {
                $scope.rechargeInfo = "激活中...";
                $http.post('/openTrialTic_Movie.msp', null, {
                    params: {
                        cardPass: $scope.lpPassword
                    }
                }).success(function (data) {
                    if (data.result == true || data.result_code == '00' || data.resultCode == '00' || data.result_code == '11' || data.resultCode == '11') {
                        console.log('礼品卡激活成功！');
                        //如果激活成功就跳转到成功的页面
                        $location.path("/activeSuccess");
                    } else {
                        console.warn('礼品卡激活失败，resultCode:' + data.resultCode);
                        //如果激活失败就跳转到激活失败的页面
                        $location.path("/activeFailed");
                    }
                })
            }
        }
    ]).

/**
 * 充值成功的控制器
 */
    controller('rechargeSuccessCtrl', ['$scope', '$rootScope',
        function ($scope, $rootScope) {
            console.log('rechargeSuccess');
            $scope.mobile = $rootScope.userInfo.mobile;
        }

    ]).
/**
 * 充值失败的控制器
 */
    controller('rechargeFailedCtrl', ['$scope', '$rootScope',
        function ($scope, $rootScope) {
            console.log('rechargeFailed');
            $scope.mobile = $rootScope.userInfo.mobile;
        }

    ]).
/**
 * 激活成功的控制器
 */
    controller('activeSuccessCtrl', ['$scope', '$rootScope',
        function ($scope, $rootScope) {
            console.log('activeSuccess');
            $scope.mobile = $rootScope.userInfo.mobile;
        }

    ]).
/**
 * 激活失败的控制器
 */
    controller('activeFailedCtrl', ['$scope', '$rootScope',
        function ($scope, $rootScope) {
            console.log('activeFailed');
            $scope.mobile = $rootScope.userInfo.mobile;
        }

    ])
/**
 * 修改密码
 */
    .controller('updatePwdCtrl', ['$rootScope', '$scope', '$http', '$location', '$timeout', 'constant', 'getSMSCodeServ',
        function ($rootScope, $scope, $http, $location, $timeout, constant, getSMSCode) {
            $scope.captchaSrc = 0;
            $scope.passwordErr = $scope.captchaErr = $scope.SMSCodeErr = $scope.submitDisabled = $scope.SMSDisabled = false;
            $scope.pwdLoginRE = constant.pwdLoginRE;
            $scope.pwdRegisterRE = constant.pwdRegisterRE;
            $scope.captchaRE = constant.captchaRE;
            $scope.SMSCodeRE = constant.SMSCodeRE;
            $scope.SMSbtnInfo = '获取验证码';
            $scope.info = '确认修改';
            $scope.mobile = $rootScope.userInfo.mobile;
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
                $scope.info = '提交中..';
                $scope.sumbitDisabled = true;
                $http.post('/updatePwd_User.msp', null, {
                    params: {
                        oldPassword: $scope.password,
                        password: $scope.newPassword
                    }
                }).success(function (data) {
                    if (data.result) {
                        $scope.info = '修改成功!';
                        $timeout(function () {
                            $rootScope.back();
                        }, 1500);
                    } else {
                        $scope.registerInfo = data.message || '修改失败';
                        $timeout(function () {
                            $scope.registerInfo = '确认修改';
                            $scope.sumbitDisabled = false;
                        }, 1000)
                    }
                })
            }
        }
    ]);
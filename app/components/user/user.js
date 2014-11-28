/**
 * Created by superman on 2014/11/3.
 */
'use strict';
angular.module('user', [])
    .constant('userConst',{
        "wapAccessUrl": "/wapAccess_Account.msp",
        "getUserInfoUrl": "components/user/getUserInfo.jsp",
        "loginUrl": "/login_Account.msp",
        "wapLoginUrl": "/wapLogin_Account.msp",
        "logoutUrl": "/logout_Account.msp"
    })
    .factory("userServ", ["$rootScope", "$http", "userConst", function ($rootScope, $http, constant) {
        var lastRunTime=0;
        return {
            /**
             * 获取用户信息
             */
            getUserInfo: function () {
                $http.get(constant.getUserInfoUrl)
                    .success(function (data, status, headers, config) {
                        $rootScope.userInfo = data.userInfo;
                    })
                    .error(function (data, status, headers, config) {
                    });
            },
            /**
             * 用户登录注销
             */
            logout: function () {
                if (!$rootScope.userInfo) {
                    return;
                }
                $http.get(constant.logoutUrl)
                    .success(function (data, status, headers, config) {
                        if (data.result) {
                            $rootScope.userInfo = null;
                        }
                    })
                    .error(function (data, status, headers, config) {
                    });
            },
            /**
             * 通过用户名（手机号、邮箱二选一）密码登录
             * @param data {msisdn || username, password, veriCode, keep}
             */
            loginByPassword: function (data) {
                var _this = this;
                $http.post(constant.loginUrl, data)
                    .success(function (data, status, headers, config) {
                        if (data.result) {
                            _this.getUserInfo();
                        }
                    })
                    .error(function (data, status, headers, config) {
                    });
            },
            /**
             * 通过访问码隐性登录
             * @param accessCode
             */
            loginByAccessCode: function () {
                var _this = this;
                $http.get(constant.wapAccessUrl)
                    .success(function (data, status, headers, config) {
                        if (data.result) {
                            $http.post(constant.wapLoginUrl, {accessCode: data.accessCode})
                                .success(function (data, status, headers, config) {
                                    if (data.result) {
                                        $rootScope.isLogin = true;
                                        $rootScope.userInfo = {};
                                        _this.requestUserInfo(true);
                                    }
                                })
                                .error(function () {
                                });
                        }
                    })
                    .error(function (data, status, headers, config) {
                    });
            },
            /**
             * @ngdoc event
             * @name requestUserInfo#userInfoUpdated
             * @eventType broadcast on root scope
             * @description
             * 用户信息更新事件,向服务器请求用户信息，并在跟新成功后触发userInfoUpdated
             * @param {Object} angularEvent Synthetic event object.
             * @param {boolean} indicate login status
             */
            requestUserInfo: function (force) {
                var now = force || Date.now();
                if (force || ( (now - lastRunTime > 5000) && (!$rootScope.userInfo ||
                    (now - $rootScope.userInfo.updateTime > 180000)) )) {
                    lastRunTime = Date.now();
                    return $http.get(constant.getUserInfoUrl).success(function (data) {
                        if (data.isLogin) {
                            $rootScope.isLogin = true;
                            $rootScope.userInfo = data.userInfo;
                            $rootScope.userInfo.updateTime = Date.now();
                        } else {
                            $rootScope.isLogin = false;
                            delete $rootScope.userInfo;
                        }
                        $rootScope.$broadcast('userInfoUpdated', data.isLogin);
                    })
                }
            }
        };
    }]);

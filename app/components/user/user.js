/**
 * Created by superman on 2014/11/3.
 */
'use strict';
angular.module('lovevApp.user', [])
    .factory("userService", ["$rootScope", "$http", "constant", function ($rootScope, $http, constant) {
        return {
            /**
             * 获取用户信息
             */
            getUserInfo: function () {
                $http.get(constant.GET_USER_INFO)
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
                $http.get(constant.LOGOUT_URL)
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
                $http.post(constant.LOGIN_BY_PASSWORD_URL, data)
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
                $http.get(constant.GET_TOKEN_URL)
                    .success(function (data, status, headers, config) {
                        if (data.result) {
                            $http.post(constant.LOGIN_BY_TOKEN_URL, {accessCode: data.accessCode})
                                .success(function (data, status, headers, config) {
                                    _this.getUserInfo();
                                })
                                .error(function () {
                                });
                        }
                    })
                    .error(function (data, status, headers, config) {
                    });
            }
        };
    }]);

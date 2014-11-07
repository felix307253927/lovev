/**
 * Created by felix on 14-11-6.
 */
angular.module('utils', [])
/**
 * @ngdoc service
 * @name dataCacheServ
 * @requires $cacheFactory
 * @description 存放一些key-value map数据
 */
    .factory('dataCacheServ', ['$cacheFactory', function ($cacheFactory) {
        return $cacheFactory('dataCacheServ');
    }])
/**
 * 提供访问时间次数控制的刷新服务，也包括第一次访问。
 */
    .provider('refreshServ', function () {
        /**
         * 设置刷新统一界限，也许对每个ctrl单独控制也不错
         * @param dur
         * @param upper
         */
        this.setBound = function (dur, upper) {
            duration = dur;
            upperTimes = upper;
        };
        var count = {},
        /*default 2.5 minutes*/
            duration = 150000,
        /*visit upper times.If visit times is bigger than this, refreshing should happen*/
            upperTimes = 3;
        this.$get = function () {
            return function (ctrlName, data) {
                if (!count[ctrlName]) {
                    count[ctrlName] = {
                        visitCount: upperTimes,
                        updateTime: 0
                    }
                }
                if (data === 'read') {
                    return count[ctrlName].data;
                }
                if (data !== undefined) {
                    count[ctrlName] = {
                        visitCount: 1,
                        updateTime: Date.now(),
                        data: data
                    };
                    return;
                }
                return (count[ctrlName].visitCount++ >= upperTimes || (Date.now() - count[ctrlName].updateTime > duration))
            }
        }
    })

/**
 * 提示窗口服务
 */
    .factory('tipServ', ['$rootScope', '$location', function ($rootScope, $location) {
        var defaultData = {
            title: '提示',
            content: '',
            contentCssClass: '',
            status: true, //status is used to display fail or success icon.  Default status is success(true).
            confirmText: '返回',
            confirm: $rootScope.back,
            cancelText: '',
            cancel: $rootScope.back
        }, data = {};
        return {
            setTip: setTip,
            data: data,
            showTip: function (settings) {
                settings && setTip(settings);
                $location.path('/tip')
            }
        };
        function setTip(tipSettings) {
            ['confirm', 'cancel'].forEach(function (method) {
                if (tipSettings.hasOwnProperty(method) && ('string' === typeof tipSettings[method])) {
                    var path = tipSettings[method];
                    tipSettings[method] = function () {
                        $location.path(path)
                    }
                }
            });
            angular.copy(defaultData, data);
            angular.extend(data, tipSettings)
        }
    }])
/**
 * 获取验证码，并进行倒计时
 */
    .provider('getSMSCodeServ', function () {
        this.setArgs = function (settings) {
            _time = settings.time || 60;
            SMSBnInfo = settings.btnInfo || '获取验证码';
        };
        var _time = 60, SMSBtnInfo = '获取验证码';
        this.$get = ['$http', '$timeout', function ($http, $timeout) {
            return function (scope) {
                if (scope.SMSDisabled) {
                    return
                }
                scope.SMSDisabled = true;
                $http.get('/sendDynPwdNew.msp?msisdn=' + scope.mobile + '&veriCode=' + scope.captcha.replace(/\s/g, '')).success(function (data) {
                    if (!data.result) {
                        //scope.SMSCodeErr = true;
                        if (data.message && data.message.indexOf('验证码' != -1)) {
                            scope.captchaErr = true
                        }
                        scope.SMSDisabled = false;
                    } else {
                        var time = _time;
                        (function fn() {
                            scope.SMSbtnInfo = time--;
                            if (time == -1) {
                                scope.SMSDisabled = false;
                                scope.SMSbtnInfo = SMSBtnInfo;
                                return;
                            }
                            $timeout(fn, 1000)
                        })();
                    }
                })
            }
        }]
    });
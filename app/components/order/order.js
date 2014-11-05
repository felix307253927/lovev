/**
 * Created by felix on 14-11-5.
 */
angular.module('lovev.order',[])

    /**
     * @ngdoc service
     * @name authentication
     * @requires $http
     * @requires $rootScope
     * @requires $q
     * @requires requestUserInfo
     *
     * @description
     * 鉴权服务
     */
    .factory('authentication', ['$http', '$rootScope', '$q', 'requestUserInfo', function($http, $rootScope, $q, requestUserInfo){
        var orderInfo={},
            isChrome = /chrome/i.test(navigator.userAgent);

        $rootScope.$on('cancelOrder', function () {
            orderInfo = {};
        });

        return {
            /**
             * @ngdoc method
             * @name authentication#getOrderInfo
             * @description
             * Get orderInfo by two id，One info could be {authenticating, isOrdered, playUrl, productID, price}
             * @param nodeid {string}
             * @param contid {string}
             */
            getOrderInfo: function(nodeid, contid) {
                return orderInfo[nodeid + contid] || (orderInfo[nodeid + contid] = {price: ''})
            },
            /**
             * @ngdoc method
             * @name authentication#authenticate
             * @description
             * 鉴权
             * @param nodeid {string}
             * @param contid {string}
             * @param netspeed {number=} 码率，默认为1
             */
            authenticate: function(nodeid, contid, netspeed){
                var oi = this.getOrderInfo(nodeid, contid),
                    args;
                oi.authenticating = true;
                args = {
                    nodeId:nodeid,
                    contentId:contid,
                    netspeed:netspeed || 1
                };
                if (isChrome) {
                    args.ishw = '1';
                    args.isHLS = '0';
                }

                $q.all([$http.get('/play.msp',{params:args}), $http.get('getPresellInfo.jsp',{params: {nid: nodeid, cid: contid}})]).then(function(results) {
                    var data = results[0].data,
                        hasMonthOrdered = $rootScope.userInfo && $rootScope.userInfo.hasMonthOrdered;

                    //预售判断
                    oi.isPresell = !!results[1].data.isPresell;
                    oi.presellInfo = results[1].data.presellInfo;
                    oi.discount =  (oi.isPresell && hasMonthOrdered) ? oi.presellInfo.discount : 1;
                    //鉴权
                    oi.authenticating = false;
                    oi.totalTime = data.filmLength || 0;
                    //如果已订购, 设置播放地址
                    if(data.isOrdered){
                        oi.playUrl = data.url;
                        oi.isOrdered = true;
                    }
                    //未订购就才保存订购信息
                    else if (data.feeds){
                        oi.productID = data.feeds[0].productId;
                        oi.price = data.feeds[0].price;
                    }
                    if (oi.isPresell) {
                        oi.price = oi.presellInfo.price
                    }
                    //已登录，但应用信息为未登录，需要更新登录信息;经证实，在未登录状态下，电视剧的前两集会显示已订购，
                    if (data.resultCode!=-1 && !$rootScope.isLogin) {
                        requestUserInfo(true);
                    }

                    $rootScope.$broadcast('authenticated', nodeid + contid)
                })//鉴权失败直接在调试器上看返回结果
            }
        }
    }])

;
/**
 * Created by felix on 14-11-10.
 */
angular.module('video',['user'])
    .constant('videoConst', {
        getPlayHistoryUrl:'/query_PlayHistory.msp',
        deletePlayHistoryUrl:'/deleteByCont_PlayHistory.msp',
        sendPlayHistoryUrl:'/add_PlayHistory.msp',
        getPresellInfoUrl:'views/videoDetails/getPresellInfo.jsp',
        playUrl:"/play.msp"
    })
/**
 * @ngdoc service
 * @name videoServ
 * @description
 * 视频播放控制，对 {@link lovevApp.directive:video `video`}的功能补充，供controller和其交互
 */
    .factory('videoServ', function() {
        var videos = {};

        return {
            play: function(nodeid, contid, src, startTime) {
                var video = videos[nodeid + contid],
                    loadedmetadataTriggered = false,
                    bodyWidth = document.body.offsetWidth;
                if (!video) {
                    for (var key in videos) {
                        if (~key.indexOf(nodeid)) {
                            var v = videos[key];
                            delete videos[key];
                            video = videos[nodeid + contid] = v;
                            break;
                        }
                    }
                }
                if (video && src) {
                    video.pause();
                    video.setAttribute('src', src);
                    video.load();
                } else if (nodeid instanceof HTMLMediaElement) {
                    video = nodeid;
                }
                if (video) {
                    video.onloadedmetadata = fn;
                    video.addEventListener('loadedmetadata', fn);
                    video.play()
                }
                function fn() {
                    if (loadedmetadataTriggered)
                        return;
                    loadedmetadataTriggered = true;
                    if (startTime) {
                        video.currentTime = startTime
                    }

                    (function fixOnePlus() {
                        if (!video.paused && video.currentTime < 5) {
                            video.play();
                            if (video.offsetHeight < 50 && video.videoHeight < 50) {
                                if (video.width < 50)
                                    video.width = bodyWidth;
                                video.height = 9 / 16 * bodyWidth;
                            }
                            setTimeout(fixOnePlus, 700)
                        }
                    })()
                }
            },
            addVideo: function(nodeid, contid, video) {
                if (nodeid && contid) {
                    videos[nodeid + contid] = video;
                }
            },
            deleteVideo: function(nodeid, contid) {
                if (nodeid && contid) {
                    delete videos[nodeid + contid];
                }
            }
        }
    })
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
/**
 * @ngdoc event
 * @name authentication#authenticated
 * @eventType broadcast on root scope
 * @description
 * 鉴权完成事件
 * @param {string} nodeid+contid, 可以用这个来确定是否是要侦听的鉴权完成事件
 */
    .factory('authentication', ['$http', '$rootScope', '$q', 'userServ','videoConst', function($http, $rootScope, $q, userServ, constant){
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

            $q.all([$http.get(constant.playUrl,{params:args}), $http.get(constant.getPresellInfoUrl,{params: {nid: nodeid, cid: contid}})]).then(function(results) {
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
                    userServ.requestUserInfo(true);
                }

                $rootScope.$broadcast('authenticated', nodeid + contid)
            });//鉴权失败直接在调试器上看返回结果
        }
    }
}])
/**
 * @ngdoc service
 * @name historySrv
 * @requires $http
 * @requires constant
 * @description
 * 播放历史服务
 */
    .factory('historyServ', ['$http', 'videoConst', function($http, constant){
    var historyKey = 'playHistory',
    //本地数据仅保存contid即可
        todayHistory = angular.fromJson(localStorage.getItem(historyKey) || []),
        serverHistory = [],
        today = (new Date).getDate(),
        start = 0,
        limit = 10,
        splice = serverHistory.splice,
        flushCount = 0,
        status = {
            busy: false,
            noMore: false
        },
        r = {
            todayHistory: todayHistory,
            serverHistory: serverHistory,
            status: status,
            loadHistory: loadHistory,
            sendHistory: sendHistory,
            deleteHistory: deleteHistory
        };

    if(today != angular.fromJson(localStorage.getItem('playHistoryDateStamp') || 0)){
        todayHistory.length = 0;
        localStorage.removeItem(historyKey);
        localStorage.setItem('playHistoryDateStamp', today);
    }

    function loadHistory() {
        status.busy = true;
        return $http.get(constant.getPlayHistoryUrl, {
            params: {
                start: start,
                limit: limit
            }
        }).success(function(data) {
            //经实测，在没有历史数据的情况下，是result==true, 然后histories==[]
            if(data.result){
                if(data.historys.length < limit){
                    status.noMore = true
                }
                if(start == 0){
                    for (var i = 0; i < data.historys.length;) {
                        if (todayHistory.some(function(record) {
                                return data.historys[i].contId == record.contid
                            })) {
                            data.historys.splice(i, 1)
                        } else {
                            i++;
                        }
                    }
                }
                //借用splice, 插入一个数组到serverHistory
                splice.bind(serverHistory, serverHistory.length, 0).apply(null, data.historys.map(function(e){
                    var name = e.contName,
                        r = {
                            name:name,
                            imgSrc: e.imgUrl.replace('/publish', '/'), //fixed img 404
                            time: e.currTime,
                            nodeid: e.nodeId,
                            contid: e.contId
                        };
                    if(name.charAt(0)=='《'){
                        var i = name.indexOf('》'),
                            j = name.indexOf('集', i);
                        if(j != -1){
                            r.name = name.substring(1, i);
                            r.currentEpisode = name.substring(i + 2, j)
                        }
                    }
                    return r
                }));
                start += limit;
            }
            status.busy = false;
        }).error(function() {status.busy = false})
    }

    function sendHistory(contid, nodeid, currentTime, totalTime, name, imgSrc, currentEpisode){
        $http.get(constant.sendPlayHistoryUrl, {
            params: {
                contentId: contid,
                nodeId: nodeid,
                currentTime: currentTime,
                totalTime: totalTime,
                ignoreLoadingBar: true
            }
        }).success(function(data) {
            var pos;
            if (data.result) {
                todayHistory.some(function(record, i) {
                    if (record.contid == contid) {
                        pos = i;
                        return true;
                    }
                });
                serverHistory.some(function(record, i) {
                    if (record.contid == contid) {
                        serverHistory.splice(i, 1);
                        return true;
                    }
                });
                if (pos === 0) {
                    todayHistory[0].time = currentTime;
                } else {
                    if (pos > 0) {
                        todayHistory.splice(pos, 1);
                    }
                    todayHistory.unshift({
                        contid: contid,
                        nodeid: nodeid,
                        name: name,
                        imgSrc: imgSrc,
                        time: currentTime,
                        currentEpisode: currentEpisode
                    });
                }
                //pos == 0 说明很可能是播放某视频时的连续添加,那样就可暂缓刷新
                if (pos !== 0 || ++flushCount > 2) {
                    flushCount = 0;
                    localStorage.setItem(historyKey, angular.toJson(todayHistory));
                }
            }
        })
    }

    function deleteHistory(contid){
        $http.get(constant.deletePlayHistoryUrl, {params:{contentId:contid}}).
            success(function(data){
                if(data.result){
                    if(!todayHistory.some(function(e, i){
                            if(e.contid==contid){
                                todayHistory.splice(i, 1);
                                localStorage.setItem(historyKey, angular.toJson(todayHistory));
                            }
                        })){
                        serverHistory.some(function(e, i){
                            if(e.contid==contid){
                                return !!serverHistory.splice(i, 1)
                            }
                        })
                    }
                }
            })
    }

    return r;
}]);
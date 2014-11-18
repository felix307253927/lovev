/**
 * Created by felix on 14-11-7.
 */
angular.module('utilDirectives', ['video','utils'])

/**
 * @ngdoc directive
 * @name script
 * @restrict E
 * @requires dataCacheServ
 * @description
 * 读取带text/data-json script下的json数据，除非手动删除否则不进行覆盖
 */
    .directive('script', ['dataCacheServ', function (dataCache) {
        return {
            restrict: 'E',
            compile: function (element, attr) {
                if (attr.type == 'text/data-json') {
                    if (!dataCache.get(attr.id)) {
                        dataCache.put(attr.id, JSON.parse(element[0].text));
                    }
                }
            }
        };
    }]).
/**
 * @ngdoc directive
 * @name video
 * @restrict E
 * @requires historySrv
 * @requires authentication
 * @requires videoSrv
 * @description
 * 读取带text/data-json script下的json数据，除非手动删除否则不进行覆盖
 */
    directive('video', ['historyServ', 'authentication', 'videoServ', function (historySrv, authentication, videoSrv) {
        return {
            restrict: 'E',
            link: function (scope, el, attr) {
                if (attr.mnNodeid && attr.mnContid) {
                    var nodeid = scope.$eval(attr.mnNodeid),
                        contid = scope.$eval(attr.mnContid),
                        totalTime = authentication.getOrderInfo(nodeid, contid).totalTime,
                        video = el[0],
                        lastSendTime = 0,
                        timer;

                    scope.$watch(attr.mnDetail, function (detail, old) {
                        if (detail) {
                            if (old) {
                                throw new Error('bind "playing" more than once!')
                            }
                            el.on('playing', function () {
                                (function sendHistory() {
                                    var delay = 3000,
                                        now = video.currentTime;

                                    //发送当前播放时间大于10s，且距离上次发送时刻5s以上的播放记录
                                    if (now > 10 && Math.abs(lastSendTime - now) > 5) {
                                        historySrv.sendHistory(contid, nodeid, Math.floor(video.currentTime),
                                            totalTime, detail.name, detail.imgSrc, detail.currentEpisode);
                                        delay = 10000;
                                        lastSendTime = now;
                                    }
                                    timer = setTimeout(sendHistory, delay);
                                })()
                            });
                        }
                    });

                    video.height = 9 / 16 * document.body.offsetWidth;
                    video.width = document.body.offsetWidth;

                    el.on('pause', function () {
                        clearTimeout(timer)
                    });

                    videoSrv.addVideo(nodeid, contid, video);
                    scope.$on('$destroy', function () {
                        clearTimeout(timer);

                        video.pause();
                        video.src = "";
                        videoSrv.deleteVideo(nodeid, contid);
                    })
                }
            }
        }
    }]).
/**
 * 背景图片延迟加载
 */
    directive('mnLazyBackground', ['$window', '$document', '$timeout', function ($window, $document, $timeout) {

        var lazyDOMs = [],
            document = $document[0];

        /**
         * 获取目标元素距离根元素的高度
         */
        function getDOMTop(elem) {
            var top = elem.offsetTop;
            while (elem = elem.offsetParent) {
                top += elem.offsetTop
            }
            return top;
        }

        function getWindowBottom() {
            return windowBottom = document.documentElement.clientHeight + ($window.scrollY ||
            document.documentElement.scrollTop || document.body.scrollTop);
        }

        angular.element($window).on('scroll', function () {
            var windowBottom = getWindowBottom();
            for (var i = 0, el; i < lazyDOMs.length;) {
                if (getDOMTop(lazyDOMs[i][0]) < windowBottom) {
                    el = angular.element(lazyDOMs[i][0]);
                    el.css({
                        'background-image': 'url(' + lazyDOMs[i][1].$eval(el.attr('mn-lazy-background')) + ')'
                    });
                    lazyDOMs.splice(i, 1);
                } else {
                    i++;
                }
            }
        });

        return {
            restrict: 'A',
            link: function (scope, el, attr) {
                var dom = el[0];
                lazyDOMs.push([dom, scope]);
                scope.$watch(attr.mnLazyBackground, function (src) {
                    var index;
                    if (src) {
                        $timeout(function () {
                            if (getDOMTop(dom) < getWindowBottom()) {
                                lazyDOMs.some(function (pair, i) {
                                    if (pair[0] == dom) {
                                        index = i;
                                        return true;
                                    }
                                });
                                if (index !== -1) {
                                    el.css({
                                        'background-image': 'url(' + src + ')'
                                    });
                                    lazyDOMs.splice(index, 1);
                                }
                            }
                        })
                    }
                });

                if (!scope._lazyDestroyBinded) {
                    scope._lazyDestroyBinded = true;
                    scope.$on('$destroy', function () {
                        for (var i = 0; i < lazyDOMs.length;) {
                            if (lazyDOMs[i][1] == scope) {
                                lazyDOMs.splice(i, 1);
                            } else {
                                i++;
                            }
                        }
                    })
                }
            }
        }
    }]).
/**
 * 使目标内的元素水平滚动化且无滚动条
 */
    directive('mnNoBarScroll', ['$window', '$swipe', function ($window, $swipe) {
        var transformProperty, is3dAvailable,
            requestAnimationFrame = $window.requestAnimationFrame ||
                $window.webkitRequestAnimationFrame ||
                $window.mozRequestAnimationFrame;

        is3dAvailable = detect3dSupport();

        // detect supported CSS property
        ['webkit', 'Moz', 'O', 'ms'].every(function (prefix) {
            var e = prefix + 'Transform';
            if (typeof document.body.style[e] !== 'undefined') {
                transformProperty = e;
                return false;
            }
            return true;
        });

        return {
            restrict: 'A',
            link: function (scope, el) {
                /* 每次touch事件的开始点 */
                var startX,
                /* wrapper的水平偏移 */
                    offset = 0,
                /* 用指定样式的div包裹待滚动元素，target是待滚动元素(仍然是el) */
                    target = el.wrap("<div class='mn-scroll-wrapper' style='overflow: hidden; white-space: nowrap;'></div>"),
                /* 内容的宽度，用来避免左滑动时右边内容进入到右界限内 */
                    contentsWidth = getContentsWidth(),
                    contentSize = target.children().length,
                    wrapperWidth;

                function swipeStart(coords) {
                    startX = coords.x;

                    //暂时在这里计算内容宽度，至少比在swipeMove中好
                    // TODO:应当监视repeatCollection的变化来计算
                    wrapperWidth = target[0].offsetWidth;
                    var newSize = target.children().length;
                    if (newSize != contentSize) {
                        contentSize = newSize;
                        contentsWidth = getContentsWidth();
                    }
                }

                function getContentsWidth() {
                    var contents = target.children(),
                        last;
                    if (!contents.length) {
                        return 0
                    } else {
                        last = contents[contents.length - 1];
                        return last.offsetLeft + last.offsetWidth - contents[0].offsetLeft;
                    }
                }

                function swipeMove(coords) {
                    var x = coords.x,
                        delta = x - startX;

                    startX = x;
                    if ((offset + delta > 0) || (contentsWidth + offset + delta < wrapperWidth)) {
                        return
                    }
                    requestAnimationFrame(function () {
                        scroll(getBound(offset + delta))
                    })

                    /*if(delta > 1 || delta < -1){
                     startX = x;
                     if((offset + delta > 0) || (contentsWidth + offset + delta < wrapperWidth)){return}
                     requestAnimationFrame(function(){
                     scroll(getBound(offset + delta))
                     })
                     } */
                }

                function getBound(x) {
                    if (x > 0) {
                        x = 0
                    } else if (x + contentsWidth < wrapperWidth) {
                        x = wrapperWidth - contentsWidth;
                    }
                    return x
                }

                function scroll(x) {
                    offset = Math.round(x);
                    target[0].style[transformProperty] = is3dAvailable ?
                    'translate3d(' + offset + 'px, 0, 0)' :
                    'translate(' + offset + 'px, 0)'
                }

                $swipe.bind(target, {
                    start: swipeStart,
                    move: swipeMove
                });
            }
        };

        //Detect support of translate3d
        function detect3dSupport() {
            var el = document.createElement('p'),
                has3d,
                transforms = {
                    'webkitTransform': '-webkit-transform',
                    'OTransform': '-o-transform',
                    'msTransform': '-ms-transform',
                    'MozTransform': '-moz-transform',
                    'transform': 'transform'
                };
            // Add it to the body to get the computed style
            document.body.insertBefore(el, null);
            for (var t in transforms) {
                if (el.style[t] !== undefined) {
                    el.style[t] = 'translate3d(1px,1px,1px)';
                    has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
                }
            }
            document.body.removeChild(el);
            return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
        }
    }]).
/**
 * 自动伸缩元素宽高比例
 */
    directive('mnScale', ['$window', function ($window) {
        return {
            restrict: 'A',
            link: function (scope, el, attr) {
                var rate = attr.mnRate || 'auto',
                    charge = attr.mnCharge || 'width',
                    dom = el[0],
                    width = dom.offsetWidth,
                    height = dom.offsetHeight;

                $window = angular.element($window);

                if (width) {
                    rate = parseFloat(rate);
                    el.css({height: width * rate + 'px'})
                }

                function onOrientationChange() {
                    el.css({height: 'auto'})
                }

                $window.on('orientationchange', onOrientationChange).
                    on('resize', onOrientationChange)

                scope.$on('$destroy', function () {
                    $window.off('orientationchange', onOrientationChange).
                        off('resiza', onOrientationChange);
                })
            }
        }
    }]).
/**
 * 自动删除DOM节点
 */
    directive('mnAutoRemove', function () {
        return {
            restrict: 'A',
            link: function (scope, el, attr) {
                var elapseTime = parseInt(attr.mnElapse || 5),
                    fadeoutTime = parseInt(attr.mnFadeout || 1);

                el.addClass('mn-auto-remove');
                setTimeout(function () {
                    el.addClass('mn-auto-removing').css({
                        'transition-duration': fadeoutTime + 's',
                        '-webkit-transition-duration': fadeoutTime + 's'
                    });
                    setTimeout(function () {
                        el.remove();
                    }, fadeoutTime * 1000);
                }, elapseTime * 1000)
            }
        }
    });
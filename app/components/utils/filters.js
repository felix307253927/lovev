/**
 * Created by felix on 14-11-7.
 */

angular.module('utilFilters', [])

/**
 * 过滤重复的视频，若重复则选最先出现的。实际上优先考虑免费的为好，但如此便需在前端耦合栏目节点(的优先级)
 */
    .filter('unique', function () {
        return function (entities) {
            if (!entities) return entities;
            var dict = {};
            return entities.reduce(function (array, entity) {
//利用对象属性的哈希性质，使过滤的时间复杂度为O(n)
                if (entity.contid && !dict[entity.contid]) {
                    dict[entity.contid] = entity.contid;
                    array.push(entity);
                }
                return array
            }, [])
        }
    }).
/**
 * 电视剧集数显示过滤器
 */
    filter('episodeView', function () {
        return function (latest, total) {
            return total == latest ? ('全' + total + '集') : ('已更新至' + latest + '集')
        }
    }).
/**
 * 免费剧集
 */
    filter('freeEpisode', function () {
        return function (episode) {
            return parseInt(episode) < 3;
        }
    }).
/**
 * 将s为单位的播放时间转换成ms为单位的UTC时间，以供date filter转换
 */
    filter('toDateTime', function () {
        return function (time) {
            return time * 1000 + 57600000
        }
    }).
/**
 * 将电视剧的集数显示补0
 */
    filter('normalizeEpisode', function () {
        return function (num, total) {
            var start = total < 10 ? -1 : total < 100 ? -2 : -3;
            return ('00' + num).substr(start)
        }
    }).
/**
 * 分割集合
 */
    filter('collectionSlice', function () {
        return function (collection, start, end) {
            if (!start) {
                return collection
            }
            if ("string" === typeof start) {
                var index = start.split('-');
                start = parseInt(index[0]) - 1;//显示的集数是基于1的
                end = index.length ? parseInt(index[1]) : start + 1;
            }
            return collection.slice(start, end);
        };
    }).
/**
 * 倒转数组
 */
    filter('reverse', function () {
        return function (array, noReverse) {
            return noReverse ? array : array.reverse();
        }
    }).
/**
 * 将数组切割为偶数,1除外
 */
    filter('even', function () {
        return function (collection, skip) {
            if (!skip) {
                var size = collection.length;
                if (size % 2 == 1 && size != 1) {
                    collection = collection.slice(0, size - 1);
                }
            }
            return collection;
        }
    }).
/**
 * 生成剧集的划分数组
 */
    filter('episodeSpanGenerator', function () {
        return function (num, length) {
            var spans = [];
            length = length || 20;
            for (var i = 1, end; num > 0; num -= length, i += length) {
                //找出每次迭代输出的边界
                end = i + length - 1;
                end = end > (i + num - 1) ? (i + num - 1) : end;

                //若只剩1集则不输出'-'
                if (end == i) {
                    spans.push('' + i);
                    break;
                }
                spans.push(i + '-' + end)
            }
            return spans;
        }
    });

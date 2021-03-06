'use strict';

// Declare app level module which depends on views, and components
angular.module('lovevApp', ['ngRoute','ngAnimate','ngTouch','infinite-scroll','angular-loading-bar',
        'utilDirectives','utilFilters','user','level1','level2','videoDetails','watchFilmTeam','interactView',
        'liveTelecast','order','searchView','login','register','userCenter'],
    ['$httpProvider', function($httpProvider){
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    }])
    //config route
    .config(['$routeProvider', 'cfpLoadingBarProvider', function($routeProvider, cfpLoadingBarProvider){
        $routeProvider.otherwise({redirectTo:'/level1'});
        cfpLoadingBarProvider.includeSpinner = false;
    }])
    //config app constants
    .constant("constant", {
        searchUrl : "components/search/searchResult.jsp",
        ipkUrl:'https://itunes.apple.com/cn/app/he-shi-jie/id771718079?mt=8',
        apkUrl:'http://www.lovev.com/download/android_isj.jsp',

        jsonScriptRE:/<script\s+.*?type=('|")text\/data-json\1.*?>([\w\W]*?)<\/script>/,
        mobileRE:/^\d{11}$/, // /^(?:13[4-9]|15[0-27-9]|18[23478]|147)\d{8}$/
        pwdLoginRE:/^\S+$/,
        pwdRegisterRE:/^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,25}$/,
        captchaRE:/^(\s*\w\s*){4}$/,
        SMSCodeRE:/^\w{6}$/,
        nodeidRE:/^\d{8}$/,
        dbqCodeRE:/^\d{16}$/,
        czkCodeRE:/^\d{17}$/,
        czkPasCodeRE:/^\d{18}$/,
        lpCodeRE:/^\d{16}$/,
        transformPostRequest: function(obj) {
            var str = [];
            for(var p in obj)
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            return str.join("&");
        }
    })
    //app initial
    .run(['$rootScope','$route','$location','$http','$window','constant','userServ',function($rootScope,$route,$location,$http,$window,constant,userServ){
        //设置自动更新用户登录状态
        (function fn(){
            userServ.requestUserInfo();
        })();

        //wap自动登陆尝试
        if(!$rootScope){
            userServ.loginByAccessCode();
        }

        //自动显示下载
        $rootScope.logout = userServ.logout();

        //设置返回按钮
        $rootScope.back=function(){history.back()};
        //滚动至顶部
        $rootScope.toTop=function(){$window.document.body.scrollTop=0};
        //设置app下载地址
        $rootScope.appUrl=/(iPad|iPhone|iPod)/.test( navigator.userAgent )?constant.ipkUrl:constant.apkUrl;

        //设置首页头部导航的横向滑动，不利于单元测试的代码
        new Swiper('.swiper-container',{scrollContainer : true,disableAutoResize:true});

        //侦听地址变化，设置头部导航的红色下划线
        $rootScope.$on('$locationChangeSuccess', function(){
            $rootScope.channel = $route.current.params.channel || $location.path().substring(1) || '';
        });

        var headerHidePath =('/userCenter /setting /about /logout /updatePassword /feedback /report /tip ' +
            '/watchFilmTeam /czCardrecharge /dbqrecharge /lpCardrecharge /myAccount /rechargeFailed ' +
            '/rechargeSuccess /activeFailed /activeSuccess /serviceOnline').split(' ').reduce(function(paths,path){
                    paths[path]=true;
                    return paths
                },{}),
            headNavShowPath = '/level1 /liveTelecast'.split(' ').reduce(function(paths, path) {
                paths[path] = true;
                return paths;
            },{});

        //routeChangeSuccess发生在视图载入后，控制器尚未初始化前
        $rootScope.$on('$routeChangeSuccess',function(){
            //侦听路由变化，控制头部页脚等的隐藏
            //非一级二级栏目都要隐藏头部导航和页脚
            $rootScope.footerHide = true;
            //仅个人中心等少数页面需要隐藏头部
            var path = $location.path(),slashIndex = path.indexOf('/',1);
            path = slashIndex ==-1 ? path : path.substring(0,slashIndex);
            $rootScope.headerHide=!!headerHidePath[path];
            $rootScope.headNavShow = !!headNavShowPath[path];

            //若是二级栏目
            if(path =='/level2'){
                //首次载入二级栏目模板时提取筛选器
                /*if(!constant.filterKeys && constant.jsonScriptRE.test($route.current.locals.$template)){
                 constant.filterKeys = JSON.parse(RegExp.$2)
                 }  */

                //设置筛选器的滑动
                setTimeout(function(){
                    [].forEach.call(document.querySelectorAll('#main-wrapper .swiper-container'),function(elem){
                        new Swiper(elem,{scrollContainer : true})
                    })
                },10)
            }
        })
    }]);
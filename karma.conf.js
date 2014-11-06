module.exports = function(config){
  config.set({

    basePath : './',

    files : [
      'app/static/libs/angular/angular.js',
      'app/static/libs/angular-route/angular-route.js',
      'app/static/libs/angular-mocks.js',
      'app/components/**/*.js',
      'app/views*/**/*.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};

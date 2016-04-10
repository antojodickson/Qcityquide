// Ionic Starter App
var categories = null;
var shops = null;
var posOptions = {timeout: 10000, enableHighAccuracy: false};
var db = null;
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'jett.ionic.filter.bar', 'ngCordova'])

.constant('ApiEndpoint', {
  url: 'https://www.qcityguide.com/mobile',
  homeurl: 'https://www.qcityguide.com/home',
  //url: 'http://10.0.0.3:8100/mobile',
  //homeurl: 'http://10.0.0.3:8100/home'
})
.run(function($ionicPlatform, Data, $rootScope, $ionicPopup, $cordovaGeolocation, $cordovaSQLite) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova) {
      db = $cordovaSQLite.openDB({ name: "qcity.db", bgType: 1 });
      if(window.cordova.plugins) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }
    } else {
      db = openDatabase('qcitydb', '1.0', 'my first database', 2 * 1024 * 1024);
    }
    $cordovaSQLite.execute(db, "DROP TABLE qcitydb");
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS mydata (key text, value blob, unique (key))");

    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    Data.categories().then(function(categories) {
      $rootScope.categories = categories;
      Data.saveLocal('categories', categories);
    });
    Data.shops().then(function(allshops) {
      $rootScope.shops = allshops;
      Data.saveLocal('shops', allshops);
    });
    var localUser = localStorage.getItem('userInfo') || null;
    $rootScope.user = JSON.parse(localUser);
    //$rootScope.currentP = [25.285447, 51.531040];
    $cordovaGeolocation
    .getCurrentPosition(posOptions)
    .then(function (pos) {
      $rootScope.currentP = [pos.coords.latitude, pos.coords.longitude];
    }, function(err) {
      // error
      $ionicPopup.alert({
        title: 'Location Settings Error',
        content: 'Please enable location settings. Go to -> Settings -> Location and turn on.'
      }).then(function(res) {
        console.log('Test Alert Box');
      });
    });

  });
})

.config(function($ionicConfigProvider) {
  $ionicConfigProvider.scrolling.jsScrolling(true);
})
.directive('fallbackSrc', function () {
  var fallbackSrc = {
    link: function postLink(scope, iElement, iAttrs) {
      iElement.bind('error', function() {
        angular.element(this).attr("src", iAttrs.fallbackSrc);
      });
    }
  }
  return fallbackSrc;
})
.directive('map', function($rootScope, $cordovaGeolocation, $ionicPopup) {
  return {
    restrict: 'E',
    scope: {
      onCreate: '&'
    },
    link: function ($scope, $element, $attr) {
      function initialize() {
        var mapOptions = {
          center: new google.maps.LatLng($rootScope.currentP[0], $rootScope.currentP[1]),
          zoom: 11,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_LEFT
          },
          zoomControl: true,
          zoomControlOptions: {
              position: google.maps.ControlPosition.TOP_RIGHT
          },
          streetViewControl: false,
        };
        var map = new google.maps.Map($element[0], mapOptions);

        $scope.onCreate({map: map});
        google.maps.event.addDomListener($element[0], 'mousedown', function (e) {
          e.preventDefault();
          return false;
        });
      }
      if (document.readyState === "complete") {
          initialize();
      } else {
        google.maps.event.addDomListener(window, 'load', initialize);
      }
    }
  }
})
.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state('intro', {
    url: "/intro",
    templateUrl: "templates/intro.html",
    controller: 'IntroCtrl'
  })
  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })
  .state('app.category', {
    url: "/category",
    views: {
        'menuContent': {
            templateUrl: "templates/category.html",
            controller: 'CategoriesCtrl'
        }
    }
  })
  .state('app.shops', {
    url: "/shops",
    views: {
        'menuContent': {
            templateUrl: "templates/shops.html",
            controller: 'ShopsCtrl',
            controllerAs: 'vm'
        }
    }
  })
  .state('app.nearby', {
    url: "/nearby/:id",
    views: {
        'menuContent': {
            templateUrl: "templates/nearby.html",
            controller: 'NearbyCtrl'
        }
    }
  })
  .state('app.directions', {
    url: "/directions",
    views: {
        'menuContent': {
            templateUrl: "templates/directions.html",
            controller: 'DirectionsCtrl'
        }
    }
  })

  .state('app.register', {
    url: "/register",
    views: {
        'menuContent': {
            templateUrl: "templates/register.html",
            controller: 'RegisterCtrl'
        }
    }
  })
  .state('app.signin', {
    url: "/signin",
    views: {
        'menuContent': {
            templateUrl: "templates/signin.html",
            controller: 'SigninCtrl'
        }
    }
  })
  .state('app.followus', {
    url: "/followus",
    views: {
        'menuContent': {
            templateUrl: "templates/followus.html",
            controller: 'FollowusCtrl'
        }
    }
  })
  .state('app.profile', {
    url: "/profile",
    views: {
        'menuContent': {
            templateUrl: "templates/profile.html"
        }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/category');
});

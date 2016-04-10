angular.module('starter.controllers', [])


.controller('IntroCtrl', function ($scope, $timeout, $state, $ionicSlideBoxDelegate) {
    $scope.disableSwipe = function() {
       $ionicSlideBoxDelegate.enableSlide(false);
    };
    $scope.start = function() {
        $scope.loading = true;
        $timeout(function() {
            $scope.loading = false;
            $state.go('app.category', {});
        }, 2000);
    }
})

.controller('AppCtrl', function ($scope, $rootScope, $state) {
  $scope.logout = function() {
    console.log("info");
    localStorage.removeItem("userInfo");
    $rootScope.user = null;
  }
})
.controller('CategoriesCtrl', function ($scope, $rootScope, Data, $state, $cordovaSQLite, $ionicFilterBar, $timeout) {
    $scope.loading = true;
    var serverData = function() {
      Data.categories().then(function(dbcategories) {
        $rootScope.categories = dbcategories;
        $scope.loading = false;
      })
    }
    var localData = function() {
      $cordovaSQLite.execute(db, "SELECT value from mydata where key = ?", ['categories']).then(function(res) {
        if(res.rows.length > 0) {
          $rootScope.categories = angular.fromJson(res.rows.item(0).value);
          $scope.loading = false;
        } else {
          serverData();
        }
      });
    }

    var getItems = function(refresh) {
      if(db) {
        localData();
      } else {
        $timeout(function() {localData();}, 1000);
      }
        if(refresh) { serverData(); $scope.$broadcast('scroll.refreshComplete'); }
        else { if(!$rootScope.categories) serverData(); }
    }

    getItems(false);

    $scope.categorySelected = function(category) {
        localStorage.setItem('category', JSON.stringify(category));
        $state.go('app.shops', {});
    }

    $scope.gotoNearby = function(id) {
        $state.go('app.nearby', {id:id}, {reload:true});
    }

    var filterBarInstance;
    $scope.showFilterBar = function () {
        filterBarInstance = $ionicFilterBar.show({
          items: $rootScope.categories,
          update: function (filteredItems, filterText) {
            $rootScope.categories = filteredItems;
          }
        });
    };

    $scope.refreshItems = function () {
        if (filterBarInstance) {
          filterBarInstance();
          filterBarInstance = null;
        }

        $timeout(function () {
          getItems();
          $scope.$broadcast('scroll.refreshComplete');
        }, 1000);
    };

})

.controller('ShopsCtrl', function ( $scope, $rootScope, $cordovaSQLite, $cordovaGeolocation, $ionicModal, $timeout, $state, $ionicFilterBar, $stateParams, Data) {
    var vm = this;
    vm.category = JSON.parse(localStorage.getItem('category'));
    var serverData = function() {
        Data.shops().then(function(dbshops) {
            shops = dbshops;
            applyItems(shops[vm.category.id]);
        });
    }
    var localData = function() {
      $cordovaSQLite.execute(db, "SELECT value from mydata where key = ?", ['shops']).then(function(res) {
        console.log("row length", res.rows.length);
        if(res.rows.length > 0) {
          shops = JSON.parse(res.rows.item(0).value);
          applyItems(shops[vm.category.id]);
        } else {
          serverData();
        }
      });
    }

    var applyItems = function(allshops) {
      vm.items = [];
      for (var si = 0; si < allshops.length; si++) {
        allshops[si].distance = 0;
        delete allshops[si].row_id;
        vm.items.push(allshops[si]);
      };
    }
    vm.getItems = function(refresh) {
      if(db) {
        localData();
      } else {
        $timeout(function() {
          serverData();
        }, 1000);
      }
      $scope.$broadcast('scroll.refreshComplete');
    }
    vm.getItems(true);

    // vm.$on("$ionicView.beforeEnter", function() {
    // });
    var filterBarInstance;
    vm.showFilterBar = function () {
        filterBarInstance = $ionicFilterBar.show({
          items: vm.items,
          update: function (filteredItems, filterText) {
            vm.items = filteredItems;
          }
        });
    };

    vm.refreshItems = function () {
        if (filterBarInstance) {
          filterBarInstance();
          filterBarInstance = null;
        }

        $timeout(function () {
          getItems();
          $scope.$broadcast('scroll.refreshComplete');
        }, 1000);
    };


    vm.getdirection = function(item) {
      vm.shopItem = item;
      localStorage.setItem('currentShop', JSON.stringify(item));
      $state.go('app.directions', {}, {reload:true});
    }

    vm.gotoNearby = function() {
        $state.go('app.nearby', {id:vm.category.id}, {reload:true});
    }

})

.controller('NearbyCtrl', function($scope, $stateParams, $window, $timeout, $rootScope, $ionicModal, $ionicLoading, $ionicPopup, Data, $cordovaGeolocation) {
    if(!shops) {
        Data.shops().then(function(dbshops) {
            shops = dbshops;
        });
    }
    $ionicLoading.show({template:'Getting current Location... please wait...'});
    $scope.title = "Nearby Shops";
    $scope.filters = {types:[], type: 0};
    var createShopMarkers = function(mshop, si) {
        infowindows[si] = new google.maps.InfoWindow({
                content: mshop.title + '<div>'+mshop.types.toString()+'</div>'
            });
            markers[si] = new google.maps.Marker({
                icon: "img/building.png",
                position: new google.maps.LatLng(mshop.lat, mshop.lng),
                optimized: true,
                map: $scope.map
              });
            markers[si].index = si;
            google.maps.event.addListener(markers[si], 'click', function() {
                    infowindows[this.index].open($scope.map,markers[this.index]);
                    $scope.map.panTo(markers[this.index].getPosition());
            });
        return;
    }

        var markers = [];
        var infowindows = [];
        var types = ['All'];
    function clearMarkers(markers) {
      for (var cm = 0; cm < markers.length; cm++) {
        markers[cm].setMap(null);
      }
      return [];
    }
    var getShops = function() {
        var allShops = shops[$stateParams.id];
        if(markers.length > 0) clearMarkers(markers);
        var usermInfoWindow = new google.maps.InfoWindow({
                content: "You"
            });
        var userm = new google.maps.Marker({
            icon: "img/person.png",
            position: new google.maps.LatLng($rootScope.currentP[0], $rootScope.currentP[1]),
            optimized: true,
            map: $scope.map
        });
        userm.addListener('click', function() {
              usermInfoWindow.open($scope.map, userm);
            });
        var i = 0;
        for(var k in allShops) {
            for (var t = 0; t < allShops[k].types.length; t++) {
                var ctype = allShops[k].types[t].replace(/[ "]/g, "");
                if(types.indexOf(ctype) == -1) types.push(ctype);
                if($scope.filters.types[$scope.filters.type] == ctype) {
                    createShopMarkers(allShops[k], i);
                }
            }
            if($scope.filters.type == 0) createShopMarkers(allShops[k], i);
            i++;
        }
        $scope.filters.types = types;
    }
    $scope.mapCreated = function(map) {
        $ionicLoading.hide();
        $scope.map = map;
        getShops();
    };
    $scope.reload = function() {
        localStorage.setItem('reloadmap', true);
        $window.location.reload(true);
    }

  $ionicModal.fromTemplateUrl('templates/shopFilters.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {$scope.modal.show();};
  $scope.closeModal = function() {$scope.modal.hide();};
  $scope.filterData = function() {$scope.openModal();}
  $scope.dashboardFilters = function() {
    getShops();
    $scope.closeModal();
  }
})

.controller('DirectionsCtrl', function($scope, $stateParams, $window, $timeout, $interval, $rootScope, $ionicModal, $ionicLoading, $ionicPopup, Data, $cordovaGeolocation) {
    $scope.type = 'DRIVING';
    $scope.shop = JSON.parse(localStorage.getItem('currentShop'));
    console.log("shop", $scope.shop);
    var startMarker = null;
    var startMarker = null;
    var myInterval = null;
    $scope.showDirection = false;
    $scope.navigation = '';
    var update = false;
    var routeError = false;
  //create route
    var directionsService = new google.maps.DirectionsService;
    $scope.mapCreated = function(map) {
        $scope.map = map;
        var rendererOptions = {
          map: $scope.map,
          suppressMarkers : true
        };
        directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
        $scope.getDirection($scope.type, update);
        myInterval = $interval(function() {
          $scope.getDirection($scope.type, update);
        }, 8000);
    };
    $scope.$on("$destroy", function (event) {
        if ( myInterval ) {
            $interval.cancel( myInterval );
            routeError = false;
        }
    });
    var markers = [];
    var endMarker = null;
    var calculateAndDisplayRoute = function() {
      if(update) {
        for (var mi = 0; mi < markers.length; mi++ ) {
          markers[mi].setMap(null);
        }
      }
      var loc = {lat: parseInt($scope.shop.lat), lng: parseInt($scope.shop.lng)};
      directionsDisplay.setPanel(document.getElementById('directions'));
      directionsService.route({
        //origin: {lat: 25.285447, lng: 51.531040},
        origin: new google.maps.LatLng($rootScope.currentP[0], $rootScope.currentP[1]),
        destination: new google.maps.LatLng($scope.shop.lat, $scope.shop.lng),
        travelMode: google.maps.TravelMode[$scope.type]
      }, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          var myRoute = response.routes[0].legs[0];
          $timeout(function() { $scope.title = myRoute.distance.text +', '+ myRoute.duration.text;}, 1000);
          $scope.title = myRoute.distance.text +', '+ myRoute.duration.text;
          var startInfo = new google.maps.InfoWindow({content: "You"});
          startMarker = new google.maps.Marker({
            position: myRoute.steps[0].start_point,
            map: $scope.map,
            icon: "img/person.png"
          });
          startMarker.addListener('click', function() {
            startInfo.open($scope.map, startMarker);
          });
          markers.push(startMarker);
          if(!endMarker) {
            var endInfo = new google.maps.InfoWindow({content: $scope.shop.title + '<div>'+$scope.shop.types.toString()+'</div>'});
            endMarker = new google.maps.Marker({
              position: myRoute.steps[myRoute.steps.length - 1].end_point,
              map: $scope.map,
              icon: "img/building.png"
            });
            endMarker.addListener('click', function() {
              endInfo.open($scope.map, endMarker);
            });
          }
          //markers.push(endMarker);
          directionsDisplay.setDirections(response);
          update = true;
        } else {
          //directionsDisplay.setMap(null);
          //startMarker.setMap(null);
          //endMarker.setMap(null);
          $scope.type = $scope.oldType;
          if(!routeError) {
            $ionicPopup.alert({
              title: 'Route Error',
              content: 'We could not find route, due to '+status.replace(/_/g, ' ')
            }).then(function(res) {
              console.log('Test Alert Box');
            });
          }
          routeError = true;
          update = false;
        }
      });
    }
    $scope.getDirection = function(type, update) {
      $scope.oldType = $scope.type;
      $scope.type = type;
      console.log("type", type);
      console.log("update", update);
      if(update) {
        $cordovaGeolocation
        .getCurrentPosition(posOptions)
        .then(function (pos) {
            //$rootScope.currentP = [25.285463, 51.531089];
            $rootScope.currentP = [pos.coords.latitude, pos.coords.longitude];
            calculateAndDisplayRoute();
        }, function(err) {
            $ionicPopup.alert({
              title: 'Location Settings Error',
              content: 'Please enable location settings. Go to -> Settings -> Location and turn on.'
            }).then(function(res) {
              console.log('Test Alert Box');
            });
            update = false;
        });
      } else {
        $scope.showDirection = false;
        calculateAndDisplayRoute();
      }
    }

    $scope.getmap = function() {
        if($stateParams.shopid) getDirection();
        else getShops();
        localStorage.setItem('reloadmap', false);
    }
    $scope.reload = function() {
        localStorage.setItem('reloadmap', true);
        $window.location.reload(true);
    }
    $scope.gotoGoogleMap = function() {
      $scope.mapPath = 'http://maps.google.com/?saddr='+$rootScope.currentP[0]+','+$rootScope.currentP[1]+'&daddr='+$scope.shop.lat+','+$scope.shop.lng;
      window.open($scope.mapPath, '_system', 'location=yes');
      return false;
    }

    $scope.getDetails = function(type) {
      $scope.directionDetails = type;
      if(type) {
        if(!$scope.showDirection) {
          var x = document.getElementById("directions");
          $scope.navigation = x.innerHTML;
        }
      }
      $scope.openModal();
      //$scope.showDirection = !$scope.showDirection;
    };
    $scope.share = {};
    $scope.shareLocation = function() {
      var locationInfo = {
        email:$scope.share.email,
        id:$scope.shop.id,
        user:$rootScope.currentP[0]+','+$rootScope.currentP[1],
        from:"",
        to:$scope.shop.title +','+$scope.shop.address,
        distence:"",
        time:""
      }
      $ionicLoading.show({template: "Sharing Location. Please wait..."});
      Data.shareLocation(locationInfo).then(function(lresp) {
        $ionicLoading.hide();
        console.log("lresp", lresp);
        $scope.closeModal();
        $ionicPopup.alert({
          title: 'sharing Location Status',
          template: 'Location shared successfully'
        });
      })
    }

  $ionicModal.fromTemplateUrl('templates/direction-details.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {$scope.modal.show();};
  $scope.closeModal = function() {$scope.modal.hide();};
  $scope.dashboardFilters = function() {
    getShops();
    $scope.closeModal();
  }
})

.controller('RegisterCtrl', function($scope, $rootScope, $ionicPopup, $ionicLoading, Data) {
  $scope.register = {
    store_name : "",
    description: "",
    store_email : "",
    gsm : "",
    f: parseInt((Math.random() * 10), 10),
    s: parseInt((Math.random() * 10), 10)
  };
  if($rootScope.currentP) {
    $scope.register.rest_lat = $rootScope.currentP[0];
    $scope.register.rest_long = $rootScope.currentP[1];
  }
  $scope.registerUser = function() {
    console.log("categories", $rootScope.categories);
    var errors = [];
    //validate
    if($scope.register.f + $scope.register.s != $scope.register.ct_captcha) {
      errors.push("Captcha value is not correct");
    }

    if(errors.length == 0) {
      $ionicLoading.show({template:"Please wait...."});
      //submit
      console.log("register", $scope.register);
      Data.register($scope.register).then(function(result) {
        $ionicLoading.hide();
        var message = JSON.parse(result);
        if(result) {
          $ionicPopup.alert({
            title: 'Registration status',
            content: message.msg,
          }).then(function(res) {
            console.log('registration failed');
          });
        }
      })
    } else {
      console.log("errors", errors);
      $ionicPopup.alert({
        title: 'Errors',
        content: errors.toString(),
      });

    }
  }
})

.controller('SigninCtrl', function($scope, $rootScope, $ionicLoading, Data, $state) {
  $scope.userData = {username:'', password:'', member_type: 'company'};
  $scope.login = function() {
    $ionicLoading.show({template:"Signing In, Please wait..."});
    Data.signin($scope.userData).then(function(resp) {
      $ionicLoading.hide();
      console.log("resp", resp);
      localStorage.setItem('userInfo', resp);
      $rootScope.user = JSON.parse(resp);
      $state.go('app.category', {}, {reload:true});
    });
  }
})

.controller('FollowusCtrl', function($scope) {

})

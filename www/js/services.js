var app = angular.module('starter.services', [])

app.factory('Data', function($rootScope, $q, $http, $cordovaSQLite, ApiEndpoint) {

  return {
  	categories: function() {
  	  var q = $q.defer();
      $http.get(ApiEndpoint.url+'/all_category_for_mobile')
	    .success(function(data) {
	      categories = data;
	      q.resolve(data);
	    })
	    .error(function(error){
	      q.reject(error);
	    });

	    return q.promise;
  	},
  	shops: function() {
		  var q = $q.defer();

	    $http.get(ApiEndpoint.url+'/all_shop_for_mobile')
		    .success(function(data) {
		      shops = data;
		      q.resolve(data);
		    })
		    .error(function(error){
		      q.reject(error);
		    });

		  return q.promise;
  	},
    register: function(params) {
      var q = $q.defer();
      // $.ajax({
      //     url : ApiEndpoint.homeurl+'/store_register',
      //     type: "POST",
      //     data : params,
      //     success: function(data, textStatus, jqXHR)
      //     {
      //         q.resolve(data);
      //         //data - response from server
      //     },
      //     error: function (jqXHR, textStatus, errorThrown)
      //     {
      //       q.reject(errorThrown);
      //     }
      // });
      var str = Object.keys(params).map(function(key){
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }).join('&');
      var xhttp = new XMLHttpRequest();
      xhttp.open("POST", encodeURI(ApiEndpoint.homeurl+'/store_register'), true);
      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhttp.onload = function() {
        console.log("xhttp", xhttp);
        if (xhttp.status === 200) {
            q.resolve(xhttp.responseText);
        }
        else if (xhttp.status !== 200) {
            q.reject(xhttp.responseText);
        }
      };
      xhttp.send(str);

      // $http({
      //     method  : 'POST',
      //     url     : ApiEndpoint.homeurl+'/store_register',
      //     data    : params, //forms user object
      //     headers : {'Content-Type': 'application/x-www-form-urlencoded'}
      //    })
      //     .success(function(data) {
      //       if (data.errors) {
      //         q.reject(data);
      //       } else {
      //         q.resolve(data);
      //       }
      //     });
      // $http.post(ApiEndpoint.homeurl+'/store_register', params)
	    // .success(function(data) {
	    //   q.resolve(data);
	    // })
	    // .error(function(error){
	    //   q.reject(error);
	    // });

	    return q.promise;
  	},
    signin: function(params) {
      var q = $q.defer();

      var str = Object.keys(params).map(function(key){
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }).join('&');
      var xhttp = new XMLHttpRequest();
      xhttp.open("POST", encodeURI(ApiEndpoint.homeurl+'/login'), true);
      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhttp.onload = function() {
        console.log("xhttp", xhttp);
        if (xhttp.status === 200) {
            q.resolve(xhttp.responseText);
        }
        else if (xhttp.status !== 200) {
            q.reject(xhttp.responseText);
        }
      };
      xhttp.send(str);
	    return q.promise;
    },
    shareLocation: function(params) {
      var q = $q.defer();

      var str = Object.keys(params).map(function(key){
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }).join('&');
      var xhttp = new XMLHttpRequest();
      xhttp.open("POST", encodeURI(ApiEndpoint.homeurl+'/send_email'), true);
      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhttp.onload = function() {
        console.log("xhttp", xhttp);
        if (xhttp.status === 200) {
            q.resolve(xhttp.responseText);
        }
        else if (xhttp.status !== 200) {
            q.reject(xhttp.responseText);
        }
      };
      xhttp.send(str);
	    return q.promise;
    },
    saveLocal: function(lkey, ldata) {
      var defer = $q.defer();
      $cordovaSQLite.execute(db, "SELECT value from mydata where key = ?", [lkey]).then(function(res) {
        if(res.rows.length > 0) {
          $cordovaSQLite.execute(db, "UPDATE mydata SET value = ? WHERE key = ?", [JSON.stringify(ldata),lkey]).then(function(ures) {
            defer.resolve("updated");
          }, function (err) {
            defer.reject(err);
          });
        } else {
          $cordovaSQLite.execute(db, "INSERT INTO mydata (key, value) VALUES (?, ?)", [lkey, JSON.stringify(ldata)]).then(function(ires) {
            defer.resolve("Inserted");
          }, function (err) {
            console.error(err);
            defer.reject(err);
          });
        }
      })
      return defer.promise;
    },
    all: function() {
      return cates;
    },
    get: function(cateId) {
      for (var i = 0; i < cates.length; i++) {
        if (cates[i].id === parseInt(cateId)) {
          return cates[i];
        }
      }
      return null;
    }
  };
});

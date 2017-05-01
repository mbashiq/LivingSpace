$(document).ready(function(){
	
});

var api_key = "AIzaSyDuK2MSiwEvl9_g-5BC5zR4uHPZq5RmB0Q";

var marker;
var reviewMarker;
var map;

var markers = [];


function initMap() {
    
    var latlng = new google.maps.LatLng(40.7128, -74.0059);
    
    var myOptions = {
        zoom: 15,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [{"featureType":"water","stylers":[{"saturation":43},{"lightness":-11},{"hue":"#0088ff"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"hue":"#ff0000"},{"saturation":-100},{"lightness":99}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#808080"},{"lightness":54}]},{"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"color":"#ece2d9"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#ccdca1"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#767676"}]},{"featureType":"road","elementType":"labels.text.stroke","stylers":[{"color":"#ffffff"}]},{"featureType":"poi","stylers":[{"visibility":"off"}]},{"featureType":"landscape.natural","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#b8cb93"}]},{"featureType":"poi.park","stylers":[{"visibility":"on"}]},{"featureType":"poi.sports_complex","stylers":[{"visibility":"on"}]},{"featureType":"poi.medical","stylers":[{"visibility":"on"}]},{"featureType":"poi.business","stylers":[{"visibility":"simplified"}]}]
    };

    map = new google.maps.Map(document.getElementById("map"),
        myOptions);
        
    google.maps.event.addListener(map, 'click', function(event) {
        placeMarker(event.latLng);
    });

    

    function placeMarker(location) {
        if (marker == undefined) {
            marker = new google.maps.Marker({
                position: location,
                map: map,
                animation: google.maps.Animation.DROP,
            });
        } else {
            marker.setPosition(location);
        }
        
                        
        var geocoder = new google.maps.Geocoder;
        var infowindow = new google.maps.InfoWindow;
                
        latlng = {lat: location.lat(), lng: location.lng()};
        
        geocoder.geocode({
            'location': latlng
        }, function(results, status) {
            if (status === 'OK') {
                if (results[1]) {
                    getOtherInfo(results[0], latlng);
                } else {
                    window.console.log('No results found');
                }
            } else {
                window.console.log('Geocoder failed due to: ' + status);
            }
        });
                  
        
    }
    
    initAutocomplete();
    
    //Get reviews from db to map
    
    firebase.database().ref('reviews').on('child_added', function(snapshot){
    	console.log(snapshot.val());
    	reviewMarker = new google.maps.Marker({
    	  position: new google.maps.LatLng(snapshot.val().lat, snapshot.val().lon),
    	  map: map,
    	  icon: 'images/like.png'
    	});
    	google.maps.event.addListener(reviewMarker, "click", function (event) {
    	    console.log(this.position.lat());
    	    
    	    var geocoder = new google.maps.Geocoder;
    	    var infowindow = new google.maps.InfoWindow;
    	            
    	    latlng = {lat: this.position.lat(), lng: this.position.lng()};
    	    
    	    geocoder.geocode({
    	        'location': latlng
    	    }, function(results, status) {
    	        if (status === 'OK') {
    	            if (results[1]) {
    	                getOtherInfo(results[0], latlng);
    	            } else {
    	                window.console.log('No results found');
    	            }
    	        } else {
    	            window.console.log('Geocoder failed due to: ' + status);
    	        }
    	    });
    	    
    	});
    });
    

}




function getOtherInfo(resultVal, latlng) {
	$('#main_body').css('filter', 'blur(3px)');
	$('.overlay').toggle();
	$('#modal').css('transform', 'translateY(0vh)');
				
	var locImg = "https://maps.googleapis.com/maps/api/streetview?size=600x300&location="+latlng.lat+","+latlng.lng+"&heading=151.78&pitch=-0.76&key="+api_key+"";
	$('.modal_header').css('background-image', "url("+locImg+")");
	
	var place_name = resultVal.formatted_address;
	var first_place_name= place_name.split(',')[0]; 
	var last_place_name= place_name.slice(first_place_name.length+2);
	
	var el = first_place_name+"<br /><span>"+last_place_name+"</span>";
	
	$('#place_name').html(el);
	
	$.ajax({
	   url: "http://api.openweathermap.org/data/2.5/weather?lat="+latlng.lat+"&lon="+latlng.lng+"&appid=76228a5b71bdda6cd911f8347ac6feaa",
	   error: function() {
	      console.log("Error fetching weather data");
	   },
	   success: function(result) {
	      $('#weather .card_icon').attr("src", "images/"+result.weather[0].icon+".png");
	      $('#weather p').text(result.weather[0].description);
	      
	      $('#temp h4').text(""+(Number(result.main.temp_min) - 273.15)+"°/"+(Number(result.main.temp_max) - 273.15)+"° C");
	      $('#wind h4').text(result.wind.speed + " m/h");
	      $('#humidity h4').text(result.main.humidity + "%");
	      
	   },
	   type: 'GET'
	});
	
	$.ajax({
	   url: "https://api.breezometer.com/baqi/?datetime=2015-10-26T16:18:34&lat="+latlng.lat+"&lon="+latlng.lng+"&key=334d22aa752e4e3d96fa2954c4d6afd0",
	   error: function() {
	      console.log("Error fetching pollution data");
	   },
	   success: function(result) {
	      $('#sugg1').text(result.breezometer_description);
	      $('#sugg2').text(result.random_recommendations.outside);
	   },
	   type: 'GET'
	});
	
	var lat = latlng.lat.toFixed(6).toString();
	var lon = latlng.lng.toFixed(6).toString();
	var fireKey = lat.replace(".", "x") + "_" + lon.replace(".", "x");
	
	console.log(fireKey);
	firebase.database().ref('locations/' + fireKey).on('child_added', function(snapshot){
		console.log(snapshot.key);
		firebase.database().ref('reviews/' + snapshot.key).on('value', function(innerSnapshot){
			if (innerSnapshot.val()) {
				console.log(innerSnapshot.val().value);
				var el = '<div class="review"><div id="'+snapshot.key+'"></div>'+innerSnapshot.val().value+'</div>';
				$('#insert_review').append(el);
				
				$("#"+snapshot.key+"").rateYo({
				    rating    : innerSnapshot.val().rating,
				    spacing   : "5px",
				    readOnly: true,
				    starWidth: "20px"
				});
				
			}
		});
	});
	
	
	getAmenities(latlng.lat, latlng.lng, "atm");
	getAmenities(latlng.lat, latlng.lng, "school");
	getAmenities(latlng.lat, latlng.lng, "bus_station");
	getAmenities(latlng.lat, latlng.lng, "hospital");
	getAmenities(latlng.lat, latlng.lng, "police");
	getAmenities(latlng.lat, latlng.lng, "gas_station");
	getAmenities(latlng.lat, latlng.lng, "train_station");
	getAmenities(latlng.lat, latlng.lng, "airport");
	
	
		
	
	
}

function getAmenities(lat, lon, type) {
	
	$.ajax({
	   url: "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="+lat+","+lon+"&rankby=distance&types="+type+"&key="+api_key+"",
	   error: function() {
	      console.log("Error fetching map data");
	   },
	   success: function(result) {
	      console.log(result);
	      $.ajax({
	         url: "https://maps.googleapis.com/maps/api/distancematrix/json?origins="+lat+","+lon+"&destinations="+result.results[0].geometry.location.lat+","+result.results[0].geometry.location.lng+"&key="+api_key+"",
	         error: function() {
	            console.log("Error fetching distance");
	         },
	         success: function(newResult) {
	            $('#'+type+' p').text(newResult.rows[0].elements[0].distance.text);
	         },
	         type: 'GET'
	      });
	      
	   },
	   type: 'GET'
	});

	
	
//	  $.ajax({
//	     url: "http://172.16.0.53:3383/api/SuitableSpace/NearestAmenity/"+lat+","+lon+"/"+type+"",
//	     error: function() {
//	        console.log("Error fetching distance");
//	     },
//	     success: function(distance) {
//	        $('#'+type+' p').text(distance + " KM");
//	        console.log(distance);
//	     },
//	     type: 'GET'
//	  });
}


function closeModal() {
	$('#modal').css('transform', 'translateY(100vh)');
	setTimeout(function(){
		$('#main_body').css('filter', 'blur(0px)');
		$('.overlay').toggle();
	}, 200);
}


http://172.16.0.53:3383/api/SuitableSpace/Filters



function sendFilter() {
	$('#loading').toggle();
	removeMarkers();
	
	var obj = {};
	obj.filter_lat = map.getCenter().lat();
	obj.filter_lon = map.getCenter().lng();
	
	var arr = [];
		
	if ($('#filter_school').is(':checked')) {
		var innerObj = {};
		innerObj.type = "school";
		innerObj.distance_range = 500;
		arr.push(innerObj);
	}
	if ($('#filter_bus_station').is(':checked')) {
		var innerObj = {};
		innerObj.type = "bus_station";
		innerObj.distance_range = 500;
		arr.push(innerObj);
	}
	if ($('#filter_atm').is(':checked')) {
		var innerObj = {};
		innerObj.type = "atm";
		innerObj.distance_range = 500;
		arr.push(innerObj);
	}
	if ($('#filter_hospital').is(':checked')) {
		var innerObj = {};
		innerObj.type = "hospital";
		innerObj.distance_range = 500;
		arr.push(innerObj);
	}
	if ($('#filter_police').is(':checked')) {
		var innerObj = {};
		innerObj.type = "police";
		innerObj.distance_range = 500;
		arr.push(innerObj);
	}
	
	obj.Filters = arr;
	
	console.log(obj);
	
//		  $.ajax({
//		     url: "http://172.16.0.53:3383/api/SuitableSpace/Filters",
//		     data: 
//		     error: function() {
//		        console.log("Error fetching distance");
//		     },
//		     success: function(distance) {
//		        $('#'+type+' p').text(distance + " KM");
//		        console.log(distance);
//		     },
//		     type: 'GET'
//		  });
		  
		  $.post("http://172.16.0.53:3383/api/SuitableSpace/Filters", obj,
		  function(data, status){
		       console.log(data);
		       
		       for (key in data) {
//		       	marker = new google.maps.Marker({
//		       	  position: new google.maps.LatLng(data[key].Latitude, data[key].Longitude),
//		       	  map: map
//		       	});
				
				var cityCircle = new google.maps.Circle({
				            strokeColor: '#FF0000',
				            strokeOpacity: 0.8,
				            strokeWeight: 2,
				            fillColor: '#FF0000',
				            fillOpacity: 0.35,
				            map: map,
				            center: new google.maps.LatLng(data[key].Latitude, data[key].Longitude),
				            radius: 500
				          });

		       	markers.push(cityCircle);
		       }
		       
		       $('#loading').toggle();
		       
		       
		  });
	
}


function removeMarkers(){
    for(i=0; i < markers.length; i++){
        markers[i].setMap(null);
    }
}





function initAutocomplete() {

        // Create the search box and link it to the UI element.
        var input = document.getElementById('pac-input');
        var searchBox = new google.maps.places.SearchBox(input);

        // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function() {
          searchBox.setBounds(map.getBounds());
        });

        var markers = [];
        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        searchBox.addListener('places_changed', function() {
          var places = searchBox.getPlaces();

          if (places.length == 0) {
            return;
          }

          // Clear out the old markers.
          markers.forEach(function(marker) {
            marker.setMap(null);
          });
          markers = [];

          // For each place, get the icon, name and location.
          var bounds = new google.maps.LatLngBounds();
          places.forEach(function(place) {
            if (!place.geometry) {
              console.log("Returned place contains no geometry");
              return;
            }

            if (place.geometry.viewport) {
              // Only geocodes have viewport.
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
          });
          map.fitBounds(bounds);
        });
      }







function review() {
	
	firebase.auth().onAuthStateChanged(function(user) {
			if (user) {
				console.log("User logged in.");
				$('.login-form').hide();
			}else {
				console.log("No user logged in.");
				$('.login-form').show();
			}
	});
	
	
	
}



var userName;
var profPic;


function google() {
	
	
	var provider = new firebase.auth.GoogleAuthProvider();
				  var self = this;
				  
				  firebase.auth().signInWithPopup(provider).then(function(result) {
					  // This gives you a Google Access Token. You can use it to access the Google API.
					  var token = result.credential.accessToken;
					  // The signed-in user info.
					  var user = result.user;
					  console.log(user);
					  
					  userName = user.displayName;
					  userPic = user.photoURL;
					  
					  console.log("Google SignIn Success.");
					  $('.login-form').hide();
					  
					  
					  
				});
	
	
}

function facebook() {
	var provider = new firebase.auth.FacebookAuthProvider();
				  var self = this;
				  
				  firebase.auth().signInWithPopup(provider).then(function(result) {
					  // This gives you a Google Access Token. You can use it to access the Google API.
					  var token = result.credential.accessToken;
					  // The signed-in user info.
					  var user = result.user;
					  console.log(user);
					  
					  userName = user.displayName;
					  userPic = user.photoURL;
					  
					  console.log("Facebook SignIn Success.");
					  $('.login-form').hide();
				});
}



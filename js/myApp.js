//Initialize the Usergrid SDK
$(document).ready(function() {
	document.addEventListener("deviceready", onDeviceReady, false);
});


// Global variables
var map, lat, lon, latlon, mylocation;
var proxm, proxkm;
var totalstores, storetype, storemarker;
var zoomlevel, bounds, distance;
var museumsArray;

function onDeviceReady() {
}

function loadScript(zl,pm) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?sensor=false&v=3&libraries=geometry&callback=initialize&async=2";
  document.head.appendChild(script);
  zoomlevel=parseInt(zl);
  proxm=parseInt(pm);
  totalstores=0;
}

function initialize() {
	$.getScript("js/StyledMarker.js");	
	var geoOptions = {'enableHighAccuracy': true, 'timeout': 10000, 'maximumAge':60000};
	navigator.geolocation.getCurrentPosition(onGetLocationSuccess, onGetLocationError, geoOptions);
	proxkm = proxm /1000;
	$("#prox").text(proxkm);
	if ($("#list li.onestore").length) {$('#list li.onestore').remove();}
	if ($("#list li.nostore").length) {$('#list li.nostore').remove();}
}


$('#museumspage').click(function() {
	storetype="museums";
	$("#storeheader").html("Museums");
	$("#storetype").html(storetype);
	loadScript(11,10000);
});

$('#parkspage').click(function() {
	storetype="parks";
	$("#storeheader").html("Parks");
	$("#storetype").html(storetype);
	loadScript(11,10000);
});


// This updates the map, listing and store page for every result
function renderStore(prox,label,name,stlat,stlon) {
	var coords = stlat+","+stlon;
	var storelatlon=new google.maps.LatLng(stlat, stlon);
	distance = (google.maps.geometry.spherical.computeDistanceBetween (storelatlon, latlon)/1000).toFixed(1);
	if(parseFloat(distance,2)<=parseFloat(prox/1000,2)) {
		// Increment total stores
		totalstores++;
		// Extend the map to fit 
		bounds.extend(storelatlon);
		map.fitBounds(bounds);
		// Update map with markers (requires StyledMarker.js) 	
		storemarker = new StyledMarker({
			styleIcon:new StyledIcon(StyledIconTypes.MARKER,
			{color:"FFFF66",text:label.toString()}),
			position:storelatlon,
			map:map});
		// Append to the list of results
		$("#list").append('<li class="onestore"><a href="#page'+label+'" data-role="button" data-transition="slide">'+name+' ('+distance+'KM)</a><span class="ui-li-count ui-btn-corner-all">'+label+'</span></li>');
	} // End if
	// Necessary for the listview to render correctly
	$("#list").listview('refresh');
	$("#totalstores").html(totalstores);
} // End renderStores Function

function updateAll()
{
	if(totalstores==0)
	{
		$("#list").append('<li class="nostore">Try increasing the search radius</li>');
		$("#list").listview('refresh');
	}
	else
	{
		$('#list li.nostore').remove();
	}
}

function onGetLocationSuccess(position)
  {
	  lat=position.coords.latitude;
	  lon=position.coords.longitude;
	  //acc=position.coords.accuracy;
	  latlon=new google.maps.LatLng(lat, lon);
	  mapholder=document.getElementById('mapholder');
	  mapholder.style.height='200px';
	  mapholder.style.width=window.innerWidth;
	  bounds = new google.maps.LatLngBounds(); // Required for zoom level and center
	  
	  var myOptions={
	  zoom:zoomlevel,
	  center:latlon,
	  mapTypeControl:false,
	  navigationControlOptions:{style: google.maps.NavigationControlStyle.SMALL},
	  mapTypeId:google.maps.MapTypeId.ROADMAP,
	  };
	  
	  google.maps.visualRefresh = true;
	  map=new google.maps.Map(document.getElementById("mapholder"),myOptions);
	  var marker=new google.maps.Marker({
		  position:latlon,
		  map:map,
		  title:"My Location!"
		  });
	  mylocation = lat+","+lon;
	  getStores(mylocation,proxm,storetype);
  } // End onGetLocationSuccess
  
function getStores(ml,pm,st)
{
		function sortByDistance(a,b){
			var astorelatlon=new google.maps.LatLng(a.location.latitude, a.location.longitude);
			var bstorelatlon=new google.maps.LatLng(b.location.latitude, b.location.longitude);
			var adistance = (google.maps.geometry.spherical.computeDistanceBetween (astorelatlon, latlon)/1000).toFixed(1);
			var bdistance = (google.maps.geometry.spherical.computeDistanceBetween (bstorelatlon, latlon)/1000).toFixed(1);
			return parseFloat(adistance,2) > parseFloat(bdistance,2) ? 1 : -1;
   		};
		// Load the JSON
		$.getJSON('museums.json', function(store) {
			sortedstore = $(store).sort(sortByDistance);
			$.each(sortedstore,function(index,value){ 
				renderStore(pm, index+1,value.name, value.location.latitude, value.location.longitude);
			});
			// Done with store, update message
			updateAll();
		});		
}

function onGetLocationError(error)
  {
	  var x=document.getElementById("errorholder");
	  x.style.height='50px';
	  x.style.display='block';
	  switch(error.code) 
		{
			case 1:
			  x.innerHTML="User denied the request for Geolocation."
			  break;
			case 2:
			  x.innerHTML="Location information is unavailable."
			  break;
			case 3:
			  x.innerHTML="The request to get user location timed out."
			  break;
			default:
			  x.innerHTML="An unknown error occurred."
			  break;
		} // End switch
  } // End onGetLocationError
  
$(window).on("orientationchange",function(event){
  // alert("Orientation is: " + event.orientation);
  // onDeviceReady();
  //location.reload();
  //$("#map").css({"width":window.innerWidth });
});

$('#reload').click(function() {
	loadScript(12,10000);
});

$('#get20').click(function() {
	loadScript(11,20000);
});

$('#get50').click(function() {
	loadScript(10,50000);
});

$('#getall').click(function() {
	loadScript(9,500000);
});
//Initialize the Usergrid SDK
$(document).ready(function() {
	document.addEventListener("deviceready", onDeviceReady, false);
});


// Global variables
var map, lat, lon, latlon, mylocation;
var proxm, proxkm;
var totalstores, storetype, storemarker;
var zoomlevel, bounds;
var museumsArray;

function onDeviceReady() {
	$.getJSON('museums.json', function(json) {
		var museumsArray=[];
		$.each(json,function(index,value){ 
			$("#errorholder").append(index+": "+value.name);
		});
	});
}

function loadScript(zl,pm) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?sensor=false&v=3&libraries=geometry&callback=initialize&async=2";
  document.head.appendChild(script);
  zoomlevel=parseInt(zl);
  proxm=parseInt(pm);
}

function initialize() {
	$.getScript("js/StyledMarker.js");	
	var geoOptions = {'enableHighAccuracy': true, 'timeout': 10000, 'maximumAge':60000};
	navigator.geolocation.getCurrentPosition(onGetLocationSuccess, onGetLocationError, geoOptions);
	proxkm = proxm /1000;
	$("#prox").text(proxkm);
}


$('#museumspage').click(function() {
	Usergrid.ApiClient.init('samer71', 'museums');
	storetype = $('input[name="museum"]').val();
	$("#storetype").text(storetype);
	loadScript(11,10000);
    window.location='#museums';
});

// This updates the map, listing and store page for every result
function renderStore(store, label) {
	var storelat=store.get('location').latitude;
	var storelon=store.get('location').longitude;
	var coords = storelat+","+storelon;
	storelatlon=new google.maps.LatLng(storelat, storelon);
	var distance = (google.maps.geometry.spherical.computeDistanceBetween (storelatlon, latlon)/1000).toFixed(1);
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
	$("#list").append('<li class="onestore"><a href="#page'+store.get('museumNumber')+'" data-role="button" data-transition="slide">'+store.get('name')+' ('+distance+'KM)</a><span class="ui-li-count ui-btn-corner-all">'+label+'</span></li>');

	// Necessary for the listview to render correctly
	$("#list").listview('refresh');
	
	$('body').append('<div data-role="page" id="page'+store.get('museumNumber')+'"><div data-theme="b" data-role="header" data-position="fixed"><h3>'+store.get('name')+'</h3><a data-role="button" data-rel="back" data-icon="arrow-l" data-iconpos="left"class="ui-btn-left">Results</a></div><img id="map" src="https://maps.googleapis.com/maps/api/staticmap?scale=2&center='+coords+'+&zoom=11&size='+window.innerWidth+'x200&markers=color:yellow%7Clabel:'+label+'%7C'+coords+'&markers=color:red%7Clabel:M%7C'+latlon+'&path=color:0x0000ff%7Cweight:5%7C'+coords+'%7C'+latlon+'&sensor=false" height="200"/><div data-role="content"><p><b>Address('+distance+'KM from you)</b><br/>'+store.get('location').displayAddress+'</p>'+store.get('description')+'<p><b>Entry Fees</b><br/>'+store.get('entryFees').join('<br/>')+'</p>'+'<p><b>Opening Hours</b><br/>'+store.get('hours').join('<br/>')+'</p>'+'<p><b>Contacts</b><br/>'+store.get('contact').join('<br/>')+'</p></div></div>');
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
	  // Initialize a local “stores” object using the SDK
      var stores = new Usergrid.Collection(st);
	  var lim=30;
	  // This query will return all stores within X meters of the current location
      stores.setQueryParams({"ql":"select * where location within "+pm+" of "+ml,"limit":"100"});
	 // Do the actual query and process the results
	stores.fetch( function(response) {
		// Process the regular store
		var count = 1;
		while(stores.hasNextEntity()) {
			renderStore(stores.getNextEntity(), count);
			//localStorage.setItem('museumObject', JSON.stringify(stores));
			count++;
		} // End while
		//var retrievedObject = localStorage.getItem('museumObject');
		//$("#errorholder").text(JSON.parse(retrievedObject));
		// Remove the loader
		totalstores=count-1;
		$("#totalstores").html(totalstores);
		if(totalstores==0)
		{
			$("#list").append('<li class="onestore">Try increasing the search radius</li>');
			$("#list").listview('refresh');
		}
		else
		{
			$("#totalstores").html(totalstores);
		}
	}); // end fetch store
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
	$('#list li.onestore').remove();
	loadScript(12,10000);
});

$('#get20').click(function() {
	$('#list li.onestore').remove();
	loadScript(11,20000);
});

$('#get50').click(function() {
	$('#list li.onestore').remove();
	loadScript(10,50000);
});

$('#getall').click(function() {
	$('#list li.onestore').remove();
	loadScript(9,500000);
});
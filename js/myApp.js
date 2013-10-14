//Initialize the Usergrid SDK
$(document).ready(function() {
	document.addEventListener("deviceready", onDeviceReady, false);
});


// Global variables
var map, lat, lon, latlon, mylocation;
var proxm, proxkm;
var totalstores, storetype, storemarker;
var zoomlevel, bounds, distance;
var storeArray=[];

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

// This updates the map, listing and store page for every result
function renderStore(prox,label,name,stlat,stlon,da,ef,h,c,desc) {
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
		$("#list").append('<li class="onestore" id="'+label+'"><a href="#page'+label+'" data-role="button" data-transition="slide">'+name+' ('+distance+'KM)</a><span class="ui-li-count ui-btn-corner-all">'+label+'</span></li>');
		
	$('body').append('<div data-role="page" id="page'+label+'"><div data-theme="b" data-role="header" data-position="fixed"><h3>'+name+'</h3><a data-role="button" data-rel="back" data-icon="arrow-l" data-iconpos="left"class="ui-btn-left">Results</a></div><img id="map" src="https://maps.googleapis.com/maps/api/staticmap?scale=2&center='+coords+'+&zoom=11&size='+window.innerWidth+'x200&markers=color:yellow%7Clabel:'+label+'%7C'+coords+'&markers=color:red%7Clabel:M%7C'+latlon+'&path=color:0x0000ff%7Cweight:5%7C'+coords+'%7C'+latlon+'&sensor=false" height="200"/><div data-role="content"><p><b>Address('+distance+'KM from you)</b><br/>'+da+'</p>'+desc+'<p><b>Entry Fees</b><br/>'+ef.join('<br/>')+'</p>'+'<p><b>Opening Hours</b><br/>'+h.join('<br/>')+'</p>'+'<p><b>Contacts</b><br/>'+c.join('<br/>')+'</p></div></div>');
		
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
			storeArray=sortedstore;
			$.each(sortedstore,function(index,value){ 
				renderStore(pm, index+1,value.name, value.location.latitude, value.location.longitude, value.location.displayAddress, value.hours, value.entryFees, value.contact, value.description);
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

// Events Section
/*
$('#list').delegate('.onestore', 'click', function ()  {
		
		$.each(storeArray,function(index,value){ 
			var stll=new google.maps.LatLng(value.location.latitude, value.location.longitude);
			var stdist = (google.maps.geometry.spherical.computeDistanceBetween (stll, latlon)/1000).toFixed(1);
			if(value.museumNumber==parseInt($(this).attr('id')))
			{
				$("#storename").html(value.name);
				$("#storedistance").html(stdist);
				$("#storeaddress").html(value.location.displayAddress);
				$("#storedescription").html(value.description);
				$("#storefees").html(value.entryFees);
				$("#storehours").html(value.hours);
				$("#storecontanct").html(value.contact);
			}
		});
});
*/
$('#categories, #panelcategories').delegate('.mainnav', 'click', function ()  {
	if(($(this).attr('id')=="museumspage") || ($(this).attr('id')=="pmuseumspage"))
	{
		storetype="museums";
		$("#storeheader").html("Museums");
	} else if(($(this).attr('id')=="artspage") || ($(this).attr('id')=="partspage")) 
	{
		storetype="arts";
		$("#storeheader").html("The Arts");
	}
	else if(($(this).attr('id')=="theaterspage") || ($(this).attr('id')=="ptheaterspage")) 
	{
		storetype="theaters";
		$("#storeheader").html("Theaters");
	}
	else if(($(this).attr('id')=="cinemaspage") || ($(this).attr('id')=="pcinemaspage")) 
	{
		storetype="cinemas";
		$("#storeheader").html("Cinemas");
	}
	else if(($(this).attr('id')=="parkspage") || ($(this).attr('id')=="pparkspage")) 
	{
		storetype="parks";
		$("#storeheader").html("Parks");
	}
	else if(($(this).attr('id')=="beachespage") || ($(this).attr('id')=="pbeachespage")) 
	{
		storetype="beaches";
		$("#storeheader").html("Beaches");
	}
	$("#right-panel").panel( "close" );
	$("#storetype").html(storetype);
	loadScript(11,10000);
});

$('#options').delegate('.option', 'click', function ()  {
	if($(this).attr('id')=="reload")
	{
		loadScript(12,10000);
	} else if($(this).attr('id')=="get20") 
	{
		loadScript(11,20000);
	}
	else if($(this).attr('id')=="get50") 
	{
		loadScript(10,50000);
	}
	else if($(this).attr('id')=="getall") 
	{
		loadScript(9,500000);
	}
});
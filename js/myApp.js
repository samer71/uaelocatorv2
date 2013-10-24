//Initialize
$(document).ready(function() {
	document.addEventListener("deviceready", onDeviceReady, false);
});
// Global variables
var map, lat, lon, latlon, mylocation;
var proxm, proxkm;
var totalstores, storetype, storemarker;
var zoomlevel, dzoom, bounds, distance;
var jsonFile;
var sortedstore;
var linkid;
var directionsDisplay;
var directionsService;
// PhoneGap is loaded and it is now safe to make calls 
function onDeviceReady() {
	$.mobile.defaultPageTransition   = 'none';
	$.mobile.defaultDialogTransition = 'none';
	$.mobile.buttonMarkup.hoverDelay = 0;
	// iOS. BB. Android
	document.addEventListener("offline", onOffline, false);
}
function onOffline() {
    // Handle the offline event
}

/*
$('#results').on('pagebeforechange', function ()  {
	$.mobile.showPageLoadingMsg("e", "Locating...");
});
$('#results').on('pagechange', function ()  {
	$.mobile.hidePageLoadingMsg();
});
*/

// Load the Google maps API script with zoom level and desired proximity
function loadScript(zl,pm) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?sensor=false&v=3&libraries=geometry&callback=initialize&async=2";
  document.head.appendChild(script);
  zoomlevel=parseInt(zl);
  proxm=parseInt(pm);
  totalstores=0;
}
// The callback function after loading the script
function initialize() {
	$.getScript("js/StyledMarker.js");	
	var geoOptions = {'enableHighAccuracy': true, 'timeout': 10000, 'maximumAge':60000};
	navigator.geolocation.getCurrentPosition(onGetLocationSuccess, onGetLocationError, geoOptions);
	proxkm = proxm /1000;
	$("#prox").text(proxkm);
	if ($("#list li.onestore").length) {$('#list li.onestore').remove();}
	if ($("#list li.nostore").length) {$('#list li.nostore').remove();}
}

/* 	Function: renderStore
	updates the map and list for every result within range
	Args: store info
*/
function renderStore(prox,label,name,stlat,stlon,da,ef,h,c,desc,fac) {
	var storelatlon=new google.maps.LatLng(stlat, stlon);
	distance = (google.maps.geometry.spherical.computeDistanceBetween (storelatlon, latlon)/1000).toFixed(1);
	// Process only if within requested distance
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
		$("#list").append('<li id="'+label+'" class="onestore"><a class="dlink" href="#details">'+name+' ('+distance+'KM)</a><span class="ui-li-count ui-btn-corner-all">'+label+'</span></li>');
	} // End if
	$("#list").listview('refresh');
	$("#totalstores").html(totalstores);
} // End renderStores Function

/* 	Function: middlePoint
	returns the mid point (in degrees) between 2 locations 
	Args: lat+lon for the 2 locations
*/
function middlePoint(lat1,lon1,lat2,lon2){
   var dLon = toRad(lon2 - lon1);
   lat1 = toRad(lat1);
   lat2 = toRad(lat2);
   lon1 = toRad(lon1);

   var Bx = Math.cos(lat2) * Math.cos(dLon);
	var By = Math.cos(lat2) * Math.sin(dLon);
	var lat3 = Math.atan2(Math.sin(lat1)+Math.sin(lat2),
                      Math.sqrt( (Math.cos(lat1)+Bx)*(Math.cos(lat1)+Bx) + By*By ) ); 
	var lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);

   var middlePoint = new Object();
   middlePoint.latitude=lat3;
   middlePoint.longitude=lon3;
   return middlePoint;
}
function toRad(Value) {
    return Value * Math.PI / 180;
}

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

function onGetLocationSuccess(position) {
	//$.mobile.hidePageLoadingMsg();
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
	bounds.extend(latlon);
	map.fitBounds(bounds);
	// Now ready to get the stores
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
	$.getJSON(jsonFile, function(store) {
		sortedstore = $(store).sort(sortByDistance);
		$.each(sortedstore,function(index,value){ 
			renderStore(pm, index+1,value.name, value.location.latitude, value.location.longitude, value.location.displayAddress, value.entryFees, value.hours, value.contact, value.description, value.facilities);
		});
		// Done with store, update message
		updateAll();
	});		
}

function onGetLocationError(error)
{
	document.getElementById("mapholder").style.display='none';
	document.getElementById("errorholder").style.display='block';
	$(".pbtn").addClass("ui-disabled");
	var x=document.getElementById("errormsg");
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
  //location.reload();
});

/* ================================================= 
   ================ Events Section ================= 
   ================================================= */

// Main page and Panel: Setup and go to results page
$('#categories, #panelcategories').delegate('.mainnav', 'tap', function ()  {
	// Check network connection 
	connectionStatus = navigator.onLine ? 'online' : 'offline';
	if(connectionStatus=='offline')
	{
		onGetLocationError(4);
	}
	else
	{
		if(($(this).attr('id')=="museumspage") || ($(this).attr('id')=="pmuseumspage"))
		{
			storetype="museums";
			jsonFile="museums.json";
			$("#storeheader").html("Museums");
		} else if(($(this).attr('id')=="artspage") || ($(this).attr('id')=="partspage")) 
		{
			storetype="arts";
			jsonFile="arts.json";
			$("#storeheader").html("The Arts");
		}
		else if(($(this).attr('id')=="theaterspage") || ($(this).attr('id')=="ptheaterspage")) 
		{
			storetype="theaters";
			jsonFile="theaters.json";
			$("#storeheader").html("Theaters");
		}
		else if(($(this).attr('id')=="cinemaspage") || ($(this).attr('id')=="pcinemaspage")) 
		{
			storetype="cinemas";
			jsonFile="cinemas.json";
			$("#storeheader").html("Cinemas");
		}
		else if(($(this).attr('id')=="parkspage") || ($(this).attr('id')=="pparkspage")) 
		{
			storetype="parks";
			jsonFile="parks.json";
			$("#storeheader").html("Parks");
		}
		else if(($(this).attr('id')=="beachespage") || ($(this).attr('id')=="pbeachespage")) 
		{
			storetype="beaches";
			jsonFile="beaches.json";
			$("#storeheader").html("Beaches");
		}
		document.getElementById("errorholder").style.display='none';
		document.getElementById("mapholder").style.display='block';
		$(".pbtn").removeClass("ui-disabled");
		$("#right-panel").panel("close");
		if(storetype=="arts") {$("#storetype").html("art galleries");}
		else {$("#storetype").html(storetype); }
		loadScript(12,10000);
		$.mobile.changePage("#results");
	} // End else
});

$('#gohome').on('click', function ()  {
	if ($("#list li.onestore").length) {$('#list li.onestore').remove();}
	if ($("#list li.nostore").length) {$('#list li.nostore').remove();}
});

$('#goback').on('tap', function ()  {
	if ($("#detailslist li.oneitem").length) {$('#detailslist li.oneitem').remove();}
	$("#detailslist").listview('refresh');
	$.mobile.changePage("#results");
});

// Store details event: shows store info
$('#list').delegate('.onestore', 'tap', function (event)  {
	linkid = parseInt($(this).attr('id'));
	$.each(sortedstore,function(index,value){ 
		if(linkid==(index+1))
		{
			var coords = value.location.latitude+","+value.location.longitude;
			var mid = middlePoint(lat,lon,value.location.latitude,value.location.longitude);
			//Convert from radians back to degrees
			var midcoords = (mid.latitude*180/Math.PI)+","+(mid.longitude*180/Math.PI);
			//var midcoords=new google.maps.LatLng((mid.latitude*180/Math.PI), (mid.longitude*180/Math.PI));
			var stlatlon=new google.maps.LatLng(value.location.latitude, value.location.longitude);
			var dist = (google.maps.geometry.spherical.computeDistanceBetween (stlatlon, latlon)/1000).toFixed(1);		
			/*
			// Calculate zoomlevel based on distance
			if(parseInt(dist)<3){dzoom=13;}
			else if (parseInt(dist)<10){dzoom=12;}
			else if (parseInt(dist)<15){dzoom=11;}
			else if (parseInt(dist)<20){dzoom=10;}
			else if (parseInt(dist)<50){dzoom=9;}
			else if (parseInt(dist)<100){dzoom=8;}
			else  {dzoom=7;}
			// The map image
			var mapimg = '<img id="map" src="https://maps.googleapis.com/maps/api/staticmap?scale=2&center='+midcoords+'+&zoom='+dzoom+'&size='+window.innerWidth+'x200&markers=color:yellow%7Clabel:'+linkid+'%7C'+coords+'&markers=color:red%7Clabel:M%7C'+latlon+'&path=color:0x0000ff%7Cweight:5%7C'+coords+'%7C'+latlon+'&sensor=false" height="200"/>'
			*/
			if ($("#mainimg").length) {$('#mainimg').remove();}
			$("#imageholder").append('<img id="mainimg" width="'+window.innerWidth+'" src="img/content/'+storetype+'/'+value.storeID+'.jpg"/>');
			$("#nameheader").html(value.name);
			$("#storedistance").html(dist);
			// Clear the list items if they exist
			if ($("#detailslist li.oneitem").length) {$('#detailslist li.oneitem').remove();}
			
			$("#detailslist").append('<li class="oneitem">'+value.location.displayAddress+'<br/>'+value.contact.Website+'</li>');
			// Phone, email, website
			if(value.contact.Tel!="") {
				$("#detailslist").append('<li class="oneitem"><a class="phonelink" href="tel:'+value.contact.Tel+'"><img src="img/phone.png" alt="Phone"/><h3>'+value.contact.Tel+'</h3><p>Click to call</P></a></li>');
			}
			else {
				$("#detailslist").append('<li class="oneitem"><img src="img/phone.png" alt="Phone"/><h3>NA</h3><p>Phone not found</P></li>');
			}
			
			if(value.contact.Email!="") {
				$("#detailslist").append('<li class="oneitem"><a class="emaillink" href="mailto:'+value.contact.Email+'"><img src="img/email.png" alt="Email"/><h3>'+value.contact.Email+'</h3><p>Click to send a message</P></a></li>');
			}
			else {
				$("#detailslist").append('<li class="oneitem"><img src="img/email.png" alt="Email"/><h3>NA</h3><p>Email address not found</P></li>');
			}
			// Location
				$("#detailslist").append('<li id="storeloc" class="oneitem"><a id="locationlink" class="loclink" href="#"><img src="img/map.png" alt="Map"/><h3>Latitude: '+value.location.latitude+'<br/>Longitude: '+value.location.longitude+'</h3><p>Show me directions</P></a><input type="hidden" id="stlatlon" value="'+stlatlon+'"/></li>');
			// Description
			$("#detailslist").append('<li class="oneitem" data-role="list-divider" data-theme="b">About</li>');
			$("#detailslist").append('<li class="oneitem">'+value.description+'</li>');
			// Facilities
			$("#detailslist").append('<li class="oneitem" data-role="list-divider" data-theme="b">Features and Facilities</li>');
			$("#detailslist").append('<li class="oneitem">'+value.facilities+'</li>');
			// Fees
			$("#detailslist").append('<li class="oneitem" data-role="list-divider" data-theme="b">Entry Fees</li>');
			$("#detailslist").append('<li class="oneitem">'+value.entryFees.join('<br/>')+'</li>');
			// Hours
			$("#detailslist").append('<li class="oneitem" data-role="list-divider" data-theme="b">Operating Hours</li>');
			$("#detailslist").append('<li class="oneitem">'+value.hours.join('<br/>')+'</li>');
			
			$("#detailslist").listview('refresh');
		} // End if found
	}); // End for each
	// Go to details page
	$.mobile.changePage("#details");
});

$('#details').on('pagebeforeshow', function ()  {
	$(".oneitem").off('tap');
});
$('#details').on('pageshow', function ()  {
	//setTimeout(function () {$(".oneitem").on('tap');}, 200); 
});

// Store location event: shows directions panel
$('#detailslist').delegate('.loclink', 'tap', function (event)  {
	//if( !$('#directionsPanel').is(':empty') ) {$('#directionsPanel').empty();}
	$.mobile.showPageLoadingMsg("e", "Calculating route...");
	// Get directions
	var directionsService = new google.maps.DirectionsService();
	directionsDisplay = new google.maps.DirectionsRenderer();
	var dmapholder=document.getElementById('dmapholder');
	dmapholder.style.display='none';
	var mapOptions={
	  zoom:10,
	  center:latlon,
	  mapTypeControl:false,
	  navigationControlOptions:{style: google.maps.NavigationControlStyle.SMALL},
	  mapTypeId:google.maps.MapTypeId.ROADMAP,
	  };
	dmap = new google.maps.Map(document.getElementById("dmapholder"), mapOptions);
	directionsDisplay.setMap(dmap);
	directionsDisplay.setPanel(document.getElementById("directionsPanel"));
	var request = {
		origin: latlon,
		destination: $('#stlatlon').val(),
		travelMode: google.maps.TravelMode.DRIVING
	  };
	directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(response);
			/*
			var myRoute = response.routes[0].legs[0];
			$("#dlist").append('<li class="onestep"><h3>Start</h3>'+response.routes[0].legs[0].start_address+'</li>');
			for (var i = 0; i < myRoute.steps.length; i++) {
				$("#dlist").append('<li class="onestep">'+myRoute.steps[i].instructions+'</li>');
			}
			$("#dlist").append('<li class="onestep"><h3>Destination</h3>'+response.routes[0].legs[0].end_address+'</li>');
			$("#dlist").append('<br/><br/><li class="onestep">'+response.routes[0].copyrights+'</li>');
			*/
		}
		else 
		//$("#dlist").append('<li class="onestep">Unable to retrieve your route. Try agian later!</li>');
		$("#directionsPanel").html("Error");
	  });
	  //setTimeout(function () {$("#dpanel").panel("open");}, 100); // delay above zero
	  //$.mobile.hidePageLoadingMsg();
	  google.maps.event.addListener(directionsDisplay, 'directions_changed', showDirections); 
	  
	  //setTimeout(function () {$.mobile.changePage("#directions");}, 200); 
	  //$.mobile.changePage("#directions");
});

function showDirections()
{
	alert($('#stlatlon').val());
	$.mobile.changePage("#directions");
}

$('#options').delegate('.option', 'tap', function ()  {
	connectionStatus = navigator.onLine ? 'online' : 'offline';
	if(connectionStatus=='offline')
	{
		onGetLocationError(4);
	}
	else
	{
		if($(this).attr('id')=="reload")
		{
			loadScript(12,10000);
			//location.reload();
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
		document.getElementById("errorholder").style.display='none';
		document.getElementById("mapholder").style.display='block';
		$(".pbtn").removeClass("ui-disabled");
		//$.mobile.showPageLoadingMsg("e", "Locating...");
	} // End else network
});

/*
last_click_time = new Date().getTime();
document.addEventListener('tap', function (e) {
    click_time = e['timeStamp'];
    if (click_time && (click_time - last_click_time) < 1000) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return false;
    }
    last_click_time = click_time;
}, true);

function downloadFile(){
	var remoteFile ="http://www.w3.org/2011/web-apps-ws/papers/Nitobi.pdf";
	var localFileName = remoteFile.substring(remoteFile.lastIndexOf('/')+1);
	//window.rootFS = fileSystem.root;
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
        fileSystem.root.getFile(localFileName, {create: true, exclusive: false},function (fileEntry) {
			var localPath = fileEntry.fullPath;
			if (device.platform === "Android" && localPath.indexOf("file://") === 0) {                    
				localPath = localPath.substring(7);                
			}
            var fileTransfer = new FileTransfer();
            //fileEntry.remove();
            fileTransfer.download(remoteFile, localPath,
                function(theFile) {
                    alert("download complete: " + theFile.toURI());
                    //showLink(theFile.toURI());
                }, fail);
        }, fail);
    }, fail);
}

function fail(error) {alert("upload error code: " + error.code);    }
*/
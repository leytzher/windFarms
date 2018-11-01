


fetch("/data/data.json")
  .then(response => response.json())
  .then(json => {
    const data = json;

    var ndx = crossfilter(data);
    console.log(ndx.all());

      // Dimensions (x-vals)
      var country = ndx.dimension((d) => { return d.Country});
      var county = ndx.dimension((d)=>{return d.County});
      var status = ndx.dimension((d) => { return d['Development_Status_(short)']});
      var capacity = ndx.dimension((d) => { return d['Installed_Capacity_(MWelec)']});
      var region = ndx.dimension((d)=>{return d.Region});
      var allDim = ndx.dimension(function(d) {return d;});


      // Groups (y-vals)
      var all = ndx.groupAll();
      var countryCount = country.group().reduceCount();
      var countyCount = county.group().reduceCount();
      var statusCount = status.group();
      var capacityGroup = capacity.group();
      var capacityCount = capacity.group().reduceSum();
      var regionCount = region.group();

      var capacityByRegion = region.group().reduceSum((d)=>{return d['Installed_Capacity_(MWelec)']});
      var capacityByCountry = country.group().reduceSum((d)=>{return d['Installed_Capacity_(MWelec)']});
      var capacityByStatus = status.group().reduceSum((d)=>{return d['Installed_Capacity_(MWelec)']});


      // Charts
      var installedCapacityBar = dc.barChart('#chart-installed-capacity');
      var regionChart = dc.pieChart('#chart-region');
      var statusChart = dc.pieChart('#chart-region-mw');
      var dataTable = dc.dataTable('#data-table');
      var dataCount = dc.dataCount('#data-count');

    // get maximum installed capacity    
      var maxCap = capacity.top(1)[0]['Installed_Capacity_(MWelec)'];    

    // get region name
      var countryData = countryCount.top(Infinity);
      var countryList=[];
      countryData.forEach(d=>{
        countryList.push(d.key)
      });

    // get status name
        var statusData = statusCount.top(Infinity);
        var statusList=[];
        statusData.forEach(d=>{
            statusList.push(d.key)
        });

        console.log(statusList);

var chartWidth = 300;
var chartHeight = 300;

// 1.- Installed Capacity per County
    installedCapacityBar
    .width(500)
    .height(300)
    .dimension(country)
    .group(capacityByCountry)
    .x(d3.scaleBand().domain(countryList))
    .xUnits(dc.units.ordinal)
    .elasticY(true)
    .centerBar(false)
    .yAxisLabel('Installed Capacity (MW)')
    .xAxisLabel('Country')
    .margins({top: 10, right: 20, bottom: 50, left: 70});
    ;

    installedCapacityBar.render();

// 2.-  Installed Capacity by Region
      regionChart
          .width(chartWidth)
          .height(chartHeight)
          .dimension(region)
          .group(capacityByRegion);

      regionChart.render();


// 3.- Installed Capacity per Status
    statusChart
    .width(chartWidth)
    .height(chartHeight)
    .dimension(status)
    .group(capacityByStatus);

    statusChart.render();
    

// 4.- Populate Table
dataTable
.dimension(allDim)
.group(function (d) { return 'dc.js insists on putting a row here so I remove it using JS'; })
.size(10)
.columns([
  function (d) { return d["Site_Name"]; },
  function (d) { return d['Region']; },
  function (d) { return d["Development_Status_(short)"]; },
  function (d) { return d['Installed_Capacity_(MWelec)']; },
  function (d) { return d['No._of_Turbines']; },
  function (d) { return d['Turbine_Capacity_(MW)']; },
])
.sortBy(function (d) { return d['Installed_Capacity_(MWelec)']; })
.order(d3.descending)
.on('renderlet', function (table) {
  // each time table is rendered remove nasty extra row dc.js insists on adding
  table.select('tr.dc-table-group').remove();
});


//5.- Data count
 dataCount
      .dimension(ndx)
      .group(all);

//6.- Reset All
  // register handlers
  d3.selectAll('a#all').on('click', function () {
    dc.filterAll();
    dc.renderAll();
  });

  d3.selectAll('a#capacity').on('click', function () {
    installedCapacityBar.filterAll();
    dc.redrawAll();
  });

  d3.selectAll('a#region').on('click', function () {
    regionChart.filterAll();
    dc.redrawAll();
  });

  d3.selectAll('a#status').on('click', function () {
    statusChart.filterAll();
    dc.redrawAll();
  });



// 5.- Map

    const options = {
        key: '1ef1FYZFI08fBFHwBNrIJjUCKCAbclZl',
        verbose: true,
        // Optional: Initial state of the map
        lat: 55.033646,
        lon:  -2.924562,
        zoom: 5
    };
    

    var windTurbine = L.icon({
        iconUrl: 'wind-turbine-32.png',
        iconSize:[10,10],
    });


var mymap;
    // Initialize Windy API
    var drawMap = function(){
    windyInit(options, windyAPI => {
        // windyAPI is ready, and contain 'map', 'store',
        // 'picker' and other usefull stuff
    
        const { map } = windyAPI
        mymap = map;
        // .map is instance of Leaflet map
    
    
        //            L.marker([51.55,-2.68719], {icon:windTurbine}).addTo(map);
    
        _.each(allDim.top(Infinity), (d) => {
            console.log(d);
            L.marker([d.Latitude,d.Longitude], { icon: windTurbine })
                .bindPopup('<table>\
                <tr><td><b>Project Name</b></th><td>'+d["Site_Name"] +'</tr>\
                <tr><td><b>Number of Turbines</b></th><td>'+d['No._of_Turbines'] +'</tr>\
                <tr><td><b>Turbine Capacity (MW)</b></th><td>'+d['Turbine_Capacity_(MW)'] +'</tr>\
                <tr><td><b>Project Capacity (MW)</b></th><td>'+d['Installed_Capacity_(MWelec)'] +'</tr>\
                <tr><td><b>Project Status</b></th><td>'+d["Development_Status_(short)"] +'</tr>\
                </table>'
                            )
                .addTo(map);
        });
    
    
    });
    };

drawMap();

dcCharts = [installedCapacityBar, regionChart, statusChart, dataTable, dataCount];

_.each(dcCharts, function (dcChart) {
    dcChart.on("filtered", function (chart, filter) {
        mymap.eachLayer(function (layer) {
          mymap.removeLayer(layer)
        }); 
    drawMap();
    });
});

dc.renderAll();

// Utility Functions:
function convertArrayOfObjectsToCSV(args) {  
  var result, ctr, keys, columnDelimiter, lineDelimiter, data;

  data = args.data || null;
  if (data == null || !data.length) {
      return null;
  }

  columnDelimiter = args.columnDelimiter || ',';
  lineDelimiter = args.lineDelimiter || '\n';

  keys = Object.keys(data[0]);

  result = '';
  result += keys.join(columnDelimiter);
  result += lineDelimiter;

  data.forEach(function(item) {
      ctr = 0;
      keys.forEach(function(key) {
          if (ctr > 0) result += columnDelimiter;

          result += item[key];
          ctr++;
      });
      result += lineDelimiter;
  });

  return result;
}


// Export as csv
var btn = document.getElementById("export")
btn.addEventListener("click",()=>{
  console.log("clicked")
  console.log(allDim.top(Infinity));
  out = allDim.top(Infinity);
  var blob = new Blob([d3.csvFormat(allDim.top(Infinity))],{type: "text/csv;charset=utf-8"});
  saveAs(blob, 'data.csv');
});




});


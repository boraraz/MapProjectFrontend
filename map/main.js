import Map from "ol/Map.js";
import View from "ol/View.js";
import Feature from "ol/Feature.js";
import { Draw, Modify, Snap } from "ol/interaction.js";
import { OSM, Vector as VectorSource } from "ol/source.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";
import { get } from "ol/proj.js";
import format from "ol/format/WKT";

var allData;
var outgoingWkt;
var incomingWkt;

const frmt = new format();
const raster = new TileLayer({
  source: new OSM(),
});

const source = new VectorSource();
const vector = new VectorLayer({
  source: source,
  style: {
    "fill-color": "rgba(255, 255, 255, 0.2)",
    "stroke-color": "#ffcc33",
    "stroke-width": 2,
    "circle-radius": 7,
    "circle-fill-color": "#ffcc33",
  },
  feature: new Feature({}),
});

// Limit multi-world panning to one world east and west of the real world.
// Geometry coordinates have to be within that range.
const extent = get("EPSG:3857").getExtent().slice();
extent[0] += extent[0];
extent[2] += extent[2];
const map = new Map({
  layers: [raster, vector],
  target: "map",
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4,
    extent,
  }),
});

let draw, snap; // global so we can remove them later
const typeSelect = document.getElementById("type");

const modify = new Modify({ source: source });
map.addInteraction(modify);
function addInteractions() {
  draw = new Draw({
    source: source,
    type: typeSelect.value,
  });
  map.addInteraction(draw);
  snap = new Snap({ source: source });
  map.addInteraction(snap);
  draw.on("drawend", function (e) {
    outgoingWkt = frmt.writeFeature(e.feature);
    add();
  });
}

/**
 * Handle change event.
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  map.removeInteraction(snap);
  addInteractions();
};

addInteractions();

$(document).ready(function () {
  $.ajaxSetup({
    cache: false,
  });
  getAll();
});

//Functions
function getAll() {
  $.ajax({
    type: "get",
    url: "https://localhost:7126/api/parcel/getparcels",
    success: parcelList,
  });
}

function deleteParcel(id) {
  $.ajax({
    type: "post",
    url: "https://localhost:7126/api/parcel/delete?id=" + id,
    success: function () {
      getAll();
    },
  });
}

function updateParcel(id) {
  $.ajax({
    type: "post",
    url:
      "https://localhost:7126/api/parcel/update?id=" +
      id +
      "&pC=" +
      $("#pcity").val() +
      "&pCo=" +
      $("#pcounty").val() +
      "&pD=" +
      $("#pdistrict").val(),
    success: function () {
      getAll();
    },
  });
}

function addParcel() {
  var Parcel = {
    parcelCity: $("#addpcity").val(),
    parcelCounty: $("#addpcounty").val(),
    parcelDistrict: $("#addpdistrict").val(),
    parcelCoordinates: outgoingWkt,
  };
  $.ajax({
    type: "post",
    url: "https://localhost:7126/api/parcel/add",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(Parcel),
    success: function () {
      addModal.style.display = "none";
      getAll();
    },
    datatype: "json",
  });
  $("#addpcity").val("");
  $("#addpcounty").val("");
  $("#addpdistrict").val("");
}

function listParcelById(id) {
  for (var i = 0; i < allData.length; i++) {
    if (allData[i].parcelId == id) {
      $("#pcity").val(allData[i].parcelCity);
      $("#pcounty").val(allData[i].parcelCounty);
      $("#pdistrict").val(allData[i].parcelDistrict);
      $("#updateParcel").val(allData[i].parcelId);
    }
  }
}

function parcelList(data) {
  var html = "";
  allData = data;
  if (data.length == 0) {
    html += "<tr>";
    html += "<td colspan='4'>No record found</td>";
    html += "</tr>";
  } else {
    for (var i = 0; i < data.length; i++) {
      html += "<tr>";
      html += "<td>" + data[i].parcelCity + "</td>";
      html += "<td>" + data[i].parcelCounty + "</td>";
      html += "<td>" + data[i].parcelDistrict + "</td>";
      html += "<td>";
      html += "<ul style='list-style-type: none'>";
      html += "<li>";
      html +=
        "<button id='editParcel' value=" +
        data[i].parcelId +
        " class='btn btn-warning'>";
      html += "<i class='fa-solid fa-pen-to-square'> </i> Edit";
      html += "</button>";
      html +=
        "<button id='deleteParcel' value=" +
        data[i].parcelId +
        " class='btn btn-danger'>";
      html += "<i class='fa-solid fa-trash'> </i> Delete";
      html += "</button>";
      html += "</li>";
      html += "</ul>";
      html += "</td>";
      html += "</tr>";
    }
  }
  const a = data[0].parcelCoordinates;
  const f = frmt.readFeature(a, {
    dataProjection: "EPSG:4326",
    featureProjection: "EPSG:3857",
  });
  source.addFeature(f);
  map.addInteraction(snap);
  $("tbody").empty();
  $("tbody").html(html);
}

//buttons
$(document).on("click", "#deleteParcel", function (event) {
  deleteParcel($(this).val());
  event.preventDefault();
});
$(document).on("click", "#editParcel", function () {
  modal.style.display = "block";
  listParcelById($(this).val());
});

//update modal
var modal = document.getElementById("updateModal");
var span = document.getElementsByClassName("close")[0];
var updateBtn = document.getElementById("updateParcel");

span.onclick = function () {
  modal.style.display = "none";
};
updateBtn.onclick = function (event) {
  event.preventDefault();
  updateParcel($(this).val());
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  } else if (event.target == addModal) {
    addModal.style.display = "none";
  }
};

//add modal
var addModal = document.getElementById("addModal");
var addSpan = document.getElementsByClassName("addClose")[0];
var addBtn = document.getElementById("addParcel");
function add() {
  addModal.style.display = "block";
}
addSpan.onclick = function () {
  addModal.style.display = "none";
};
addBtn.onclick = function (event) {
  event.preventDefault();
  addParcel();
  addModal.style.display = "none";
};

// incomingWkt =
//   "POLYGON((-12245082.753737235 5672182.195756167,-12195169.374267016 4660270.596802861,-11187843.99701082 4746032.942538829,-11102081.651274852 5508186.551570321,-11919308.139185814 5638970.306966258,-12245082.753737235 5672182.195756167))";
// console.log(incomingWkt);
// featureWKT = frmt.readFeature(incomingWkt, {
//   dataProjection: "EPSG:4326",
//   featureProjection: "EPSG:3857",
// });

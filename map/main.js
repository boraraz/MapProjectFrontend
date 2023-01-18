import Map from "ol/Map.js";
import View from "ol/View.js";
import { Draw, Modify, Snap } from "ol/interaction.js";
import { OSM, Vector as VectorSource } from "ol/source.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";
import { get } from "ol/proj.js";

$(document).ready(function () {
  $.ajax({
    type: "get",
    url: "https://localhost:7126/api/parcel/getparcels",
    success: parcelList,
  });
});

function parcelList(data) {
  var html = "";
  for (var i = 0; i < data.length; i++) {
    html += "<tr>";
    html += "<td>" + data[i].parcelCity + "</td>";
    html += "<td>" + data[i].parcelCounty + "</td>";
    html += "<td>" + data[i].parcelDistrict + "</td>";
    html += "<td>";
    html += "<ul style='list-style-type: none'>";
    html += "<li>";
    html += "<button id='editParcel' class='btn btn-warning'>";
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
  $("tbody").html(html);
}

$(document).on("click", "#deleteParcel", function () {
  deleteParcel($(this).val());
});

function deleteParcel(id) {
  $.ajax({
    type: "post",
    url: "https://localhost:7126/api/parcel/delete?id=" + id,
    success: function (data) {
      alert(data);
    },
  });
}

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
  },
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

const modify = new Modify({ source: source });
map.addInteraction(modify);

let draw, snap; // global so we can remove them later
const typeSelect = document.getElementById("type");

function addInteractions() {
  draw = new Draw({
    source: source,
    type: typeSelect.value,
  });
  map.addInteraction(draw);
  snap = new Snap({ source: source });
  map.addInteraction(snap);
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

﻿import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuEventService } from '../_services/menuEvent.service';
import { CanimapService } from '../_services/canimap.service';
import { Subscription }   from 'rxjs/Subscription';

import * as L from 'leaflet';
import * as $ from 'jquery';

import { Map, Layer, Path, LayerEvent, LeafletEvent, LocationEvent } from '@types/leaflet';

@Component({
  selector: 'canimap',
  templateUrl: './canimap.component.html',
  styleUrls: ['./canimap.component.css']
})
export class CanimapComponent implements OnInit {
  map:Map;
  title = 'app';
  color = null;
  opacity = 0.5;
  currentLocation: any = null;
  subscriptions = new Array<Subscription>();

  googleHybride = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    opacity: 0.5
  });
  googleSatellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    opacity: 1
  });
  ignMap = L.tileLayer("https://wxs.ign.fr/" +
    "6i88pkdxubzayoady4upbkjg" + "/geoportail/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=" +
    "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR" + "&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image%2Fjpeg",
    {opacity: 0.5});

  options = {
    layers: [
      this.googleSatellite,
      this.ignMap
    ],
    zoom: 15,
    center: L.latLng([45.419364, 5.347022])
  };
  featureGroup = new L.FeatureGroup();
  drawOptions = {
    position: 'topleft',
    featureGroup: this.featureGroup
  };
  layersControl = {
    overlays: {
      'Google Satellite </div></label><label><div id="google_slider_container">': this.googleSatellite,
      'IGN </div></label><label><div id="ign_slider_container">': this.ignMap,
      'Google Hybride </div></label><label><div id="google_hybride_slider_container">': this.googleHybride
    }
  };

  constructor(
    private menuEventService: MenuEventService,
    private canimapService: CanimapService) {
  }

  ngOnInit(){
  }

  onValueChanged(event:any) {
    console.log("received opacity change for:" + event.target + " new value: " + event.value);
    switch (event.target) {
      case "ign":
        this.ignMap.setOpacity(event.value);
        break;
      case "google":
        this.googleSatellite.setOpacity(event.value);
        break;
      case "hybride":
        this.googleHybride.setOpacity(event.value);
        break;
      default:
        console.log("no layer found: " + event.target);
        break;
    }
  }

  onMapReady(map:Map) {
    this.map = map;
    this.canimapService.map = map;
    this.canimapService.subscribe();

    this.map.on(L.Draw.Event.CREATED, (e:LayerEvent) => {
      console.log(e);
      try {
        let path:Path = <Path>e.layer;
        path.setStyle({color: this.color});
        this.map.addLayer(<Layer>path);
      } catch (e) {
        console.log(e);
      }
    });

    setTimeout(function() {
      $(".leaflet-draw-toolbar").first().prepend('<a class="leaflet-draw-draw-color" title="Change color"><span class="sr-only">Change color</span></a>');
      $(".leaflet-draw-draw-color").append($(".colorpicker"))
    }, 500);
  }
}
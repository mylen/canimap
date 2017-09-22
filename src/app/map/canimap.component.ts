﻿import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuEventService, CanimapService, FileService } from '../_services/index';
import { Subscription } from 'rxjs/Subscription';

import * as L from 'leaflet';
import * as $ from 'jquery';
import 'leaflet-polylinedecorator';
// import * as N from 'leaflet-illustrate';

import { Map, Polyline, Rectangle, Circle, Polygon, Layer, FeatureGroup, Path, LayerEvent, LeafletEvent, LocationEvent } from 'leaflet';
import { FontAwesomeOptions, FontAwesomeIcon } from 'ngx-leaflet-fa-markers/index';

@Component({
  selector: 'app-canimap',
  templateUrl: './canimap.component.html',
  styleUrls: ['./canimap.component.css']
})
export class CanimapComponent implements OnInit {
  polyline: L.Polyline;
  map: Map;
  title = 'app';
  savedColor: string;
  opacity = 0.5;
  currentLocation: any = null;
  success: Function;
  public geoJson: any[] = new Array();
  private subscriptions = new Array<Subscription>();

  get layers() {
    const layers = new Array<L.TileLayer>();
    [this.googleHybride, this.ignMap, this.googleSatellite].forEach(layer => {
      if (layer.options.opacity > 0) {
        layers.push(layer);
      }
    });
    return layers;
  }

  googleHybride = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    opacity: 0
  });
  googleSatellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    opacity: 0
  });
  ignMap = L.tileLayer('https://wxs.ign.fr/' +
    '6i88pkdxubzayoady4upbkjg' + '/geoportail/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=' +
    'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR' + '&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image%2Fjpeg',
    { opacity: 1 });

  options = {
    layers: this.layers,
    zoom: 15,
    center: L.latLng([45.419364, 5.347022])
  };
  featureGroup = new L.FeatureGroup();
  iconOption: FontAwesomeOptions = {
    iconClasses: 'fa fa-info-circle', // you _could_ add other icon classes, not tested.
    // iconColor: '#F00',
    iconUrl: '../assets/marker-icon.png',
    shadowUrl: '../assets/marker-shadow.png'
  };
  icon = new FontAwesomeIcon(this.iconOption);

  drawOptions = {
    position: 'topleft',
    featureGroup: this.featureGroup,
    draw: {
      marker: {
        icon: this.icon,
        draggable: true
      },
      polyline: {
        metric: 'metric',
        showLength: true
      },
      circle: {
        shapeOptions: {
          color: '#aaaaaa'
        }
      }
    }
  };

  private states = {
    DRAWING: 'drawing',
    PATH: 'path'
  };
  private previousState = this.states.DRAWING;
  
  constructor(
    private menuEventService: MenuEventService,
    private canimapService: CanimapService,
    private fileService: FileService) {
  }

  switchState(state) {
    if (state === this.states.DRAWING) {
      if (this.previousState === this.states.PATH) {
        this.canimapService.color = this.savedColor;
        this.previousState = this.states.DRAWING;
      }
    } else if (state === this.states.PATH) {
      if (this.previousState === this.states.DRAWING) {
        this.savedColor = this.canimapService.color;
        this.previousState = this.states.PATH;
      }
    }
  }

  ngOnInit() {
//    (<any>L.Browser).touch = false;
  }

  onValueChanged(event: any) {
    console.log('received opacity change for:' + event.target + ' new value: ' + event.value);
    switch (event.target) {
      case 'ign':
        this.ignMap.setOpacity(event.value);
        break;
      case 'google':
        this.googleSatellite.setOpacity(event.value);
        break;
      case 'hybride':
        this.googleHybride.setOpacity(event.value);
        break;
      default:
        console.log('no layer found: ' + event.target);
        break;
    }
  }

  hexToRgb(hex: string) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  onMapReady(map: Map) {
    this.map = map;
    this.canimapService.map = map;
    this.canimapService.subscribe();
    this.fileService.subscribe();
    this.canimapService.geoJSON = this.geoJson;
    this.canimapService.layers = [
      { name: 'ign', layer: this.ignMap },
      { name: 'google hybride', layer: this.googleHybride },
      { name: 'google sattelite', layer: this.googleSatellite }
    ];
    this.savedColor = this.canimapService.color;

    this.subscriptions.push(this.menuEventService.getObservable('drawVictimPath').subscribe(
      (value) => {
        this.success = value.success;
        this.switchState(this.states.PATH);
        this.canimapService.color = '#00F';
        $('.leaflet-draw-draw-polyline')[0].click();
      },
      e => console.log(e),
      () => console.log('onCompleted')
    ));

    this.subscriptions.push(this.menuEventService.getObservable('drawK9Path').subscribe(
      (value) => {
        this.success = value.success;
        this.switchState(this.states.PATH);
        this.canimapService.color = '#F93';
        $('.leaflet-draw-draw-polyline')[0].click();
      },
      e => console.log(e),
      () => console.log('onCompleted')
    ));
    this.map.on(L.Draw.Event.EDITED, (e: L.DrawEvents.Edited) => {
      this.map.fitBounds(this.map.getBounds());
    });
    const me = this;
    this.map.on(L.Draw.Event.CREATED, (e: L.DrawEvents.Created) => {
      try {
        if (me.success !== undefined) {
          me.success();
        }
        const layer: Layer = e.layer;
        if (e.layerType === 'polyline') {
          me.polyline = <Polyline>layer;
          const popup = new L.Popup({ autoClose: false, closeOnClick: false });
          popup.setContent(me.distance(me.polyline.getLatLngs()).toFixed(0) + ' m');
          popup.options['color'] = me.canimapService.color;
          me.map.on('popupopen', (pop: any) => {
            let color = pop.popup.options['color'];
            color = me.hexToRgb(color);
            const colorCss = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',0.6)';
            const elements = $(pop.popup.getElement()).find('.leaflet-popup-content-wrapper, .leaflet-popup-tip');
            elements.css('background', colorCss);
            if (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b > 200) {
              elements.css('color', 'black');
            } else {
              elements.css('color', 'white');
            }
          });
          me.polyline.bindPopup(popup);
          let json: any = me.polyline.toGeoJSON();
          json['properties'] = { color: me.canimapService.color };
          me.geoJson.push(json);
          me.polyline.setStyle({ color: me.canimapService.color });
          const polylineDecoratorOptions = {
            patterns: [
              {
                offset: 20, repeat: 50,
                symbol: L.Symbol.arrowHead(
                  {
                    pixelSize: 10,
                    polygon: true,
                    pathOptions: { stroke: true, color: me.canimapService.color }
                  })
              }
            ]
          };
          const featureGroup = <FeatureGroup>L.polylineDecorator(me.polyline, polylineDecoratorOptions);
          me.map.addLayer(featureGroup);
          json = featureGroup.toGeoJSON();
          json['properties'] = { color: me.canimapService.color };
          me.geoJson.push(json);
        }
        if (e.layerType === 'rectangle') {
          const rectangle: Rectangle = <Rectangle>layer;
          const json: any = rectangle.toGeoJSON();
          json['properties'] = { color: me.canimapService.color };
          me.geoJson.push(json);
          rectangle.setStyle({ color: me.canimapService.color });
        }
        if (e.layerType === 'polygon') {
          const polygon: Polygon = <Polygon>layer;
          const json: any = polygon.toGeoJSON();
          json['properties'] = { color: me.canimapService.color };
          me.geoJson.push(json);
          polygon.setStyle({ fillColor: me.canimapService.color });
        }
        if (e.layerType === 'circle') {
          const circle: Circle = <Circle>layer;
          const json: any = circle.toGeoJSON();
          json['properties'] = { color: me.canimapService.color };
          me.geoJson.push(json);
          circle.setStyle({ fillColor: me.canimapService.color });
        }
        me.map.addLayer(layer);
        me.switchState(me.states.DRAWING);
      } catch (e) {
        console.log(e);
      }
    });
  }

  distance(latlngs: L.LatLng[]): number {
    let tempLatLng = null;
    let totalDistance = 0.00000;
    latlngs.forEach((latlng: L.LatLng) => {
      if (tempLatLng == null) {
        tempLatLng = latlng;
        return;
      }
      totalDistance += tempLatLng.distanceTo(latlng);
      tempLatLng = latlng;
    });
    return totalDistance;
  }
}

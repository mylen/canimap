import {Injectable, OnDestroy} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {EventService} from './event.service';
import {UserService} from './user.service';
import {DeviceDetectorService} from 'ngx-device-detector';
import {LogService} from '../_services/log.service';
import {MapBox} from '../_models/mapBox';
import {LayerBox} from '../_models/layerBox';
import {User} from '../_models/user';
import {SETTINGS} from '../_consts/settings';
import {Events} from '../_consts/events';
import {popupDMS} from '../_utils/map-popup';

import * as ol from 'openlayers';

declare var $;
declare var GyroNorm;

@Injectable()
export class MapService implements OnDestroy {

    osm = new LayerBox(
        'osm',
        'Osm',
        this.getOsmLayer('osm', 0, false)
    );
    bingSatellite = new LayerBox(
        'bingSatellite',
        'Bing Satellite',
        this.getBingLayer('bingSatellite', 'Aerial', 0, false)
    );
    googleSatellite = new LayerBox(
        'googleSatellite',
        'Google Satellite',
        this.getGoogleLayer('googleSatellite', 's', 0, false)
    );
    googleHybride = new LayerBox(
        'googleHybride',
        'Google Hybride',
        this.getGoogleLayer('googleSatellite', 'y', 0, false)
    );
    bingHybride = new LayerBox(
        'bingHybride',
        'Bing Hybride',
        this.getBingLayer('bingHybride', 'AerialWithLabels', 1, true)
    );
    ignPlan = new LayerBox(
        'ignPlan',
        'IGN Topo',
        this.getIgnLayer('ignPlan', 'GEOGRAPHICALGRIDSYSTEMS.MAPS', 0, false)
    );
    ignSatellite = new LayerBox(
        'ignSatellite',
        'IGN Photo Aeriennes',
        this.getIgnLayer('ignSatellite', 'ORTHOIMAGERY.ORTHOPHOTOS', 0, false)
    );
    private gn: any;
    private watchPositionId: number;
    private map: ol.Map;

    constructor(
        private eventService: EventService,
        private userService: UserService,
        private deviceService: DeviceDetectorService,
        private log: LogService
    ) {
        if (deviceService.isMobile()) {
            this.gn = new GyroNorm();
        }
        this.eventService.subscribe(Events.MAP_MOVE, (
            (coords: any) => {
                this.log.debug('[MapService] moving map to :' + JSON.stringify(coords));
                this.map.getView().setCenter(ol.proj.fromLonLat([coords.lng, coords.lat]));
                this.map.getView().setZoom(18);
                if (coords.success) {
                    coords.success();
                }
            }
        ));
        this.eventService.subscribe(Events.MAP_SET_RESOLUTION, (
            (resolution: number) => {
                this.log.debug('[MapService] setting map scale to :' + resolution);
                resolution = resolution / 3570;
                this.map.getView().setResolution(resolution);
            }
        ));
    }

    get layerBoxes(): LayerBox[] {
        return [this.ignPlan, this.ignSatellite, this.googleSatellite, this.googleHybride, this.osm, this.bingSatellite, this.bingHybride];
    }

    private get user(): Observable<User> {
        return this.userService.currentUser();
    }

    compass() {
        if (this.watchPositionId) {
            navigator.geolocation.clearWatch(this.watchPositionId);
            this.gn.end();
            this.watchPositionId = null;
        } else {
            this.watchPositionId = navigator.geolocation.watchPosition(
                position => {
                    this.eventService.call(
                        Events.MAP_MOVE,
                        {
                            lat: position.coords.latitude, lng: position.coords.longitude, success: () => {
                            }
                        }
                    );
                },
                error => this.log.error('[MapService] Error while getting current position: ' + JSON.stringify(error)),
                {enableHighAccuracy: true}
            );
            const initialAngle = this.map.getView().getRotation();
            const me = this;
            me.gn.init({frequency: 50, orientationBase: GyroNorm.GAME}).then(function () {
                me.gn.start(function (event) {
                    event.do.alpha = event.do.alpha;
                    const alpha = event.do.alpha * Math.PI * 2 / 360;
                    me.log.info(`a: ${event.do.alpha}`, true);
                    me.map.getView().setRotation(initialAngle + alpha);
                });
            });
        }
    }

    addMarker(coords) {
        this.log.debug('[MapService] adding marker to :' + JSON.stringify(coords));
        const iconFeature = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([coords.lng, coords.lat])),
        });
        iconFeature.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
                radius: 10,
                stroke: new ol.style.Stroke({
                    color: 'purple',
                    width: 2
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255,0,0,0.5)'
                })
            })
        }));
        this.map.addLayer(new ol.layer.Vector({source: new ol.source.Vector({features: [iconFeature]})}));
    }

    gpsMarker() {
        this.log.debug('[MapService] drawing gps marker');
        this.eventService.call(Events.MAP_DRAW_INTERACTIONS_DISABLE);
        popupDMS('.ol-popup', this.map, this.eventService);
    }

    rotate(radians: number) {
        this.map.getView().setRotation(radians);
    }

    setMapFromUserPreferences(user: User): Observable<any> {
        const observable = new Observable((observer) => {
            if (user.mapBoxes) {
                user.mapBoxes.forEach(m => {
                    const layerBox = this.layerBoxes.find(l => m.key === l.key);
                    if (layerBox) {
                        layerBox.layer.setOpacity(m.opacity);
                        layerBox.layer.setVisible(m.visible);
                    } else {
                        // there is a problem with the saved data, removed corrupted entry
                        user.mapBoxes.slice(user.mapBoxes.lastIndexOf(m), 1);
                    }
                });
            } else {
                user.mapBoxes = new Array<MapBox>();
                this.layerBoxes.forEach(layerBox => {
                    user.mapBoxes.push(new MapBox(layerBox.key, layerBox.layer.getOpacity(), layerBox.layer.getVisible()));
                });
            }
            observer.next();
        });
        return observable;
    }

    loadMap() {
        const map = new ol.Map({
            target: 'map',
            controls: ol.control.defaults({
                attributionOptions: /** @type {ol.control.AttributionOptions} */ {
                    collapsible: false
                }
            }).extend([
                new ol.control.ScaleLine()
            ]),
            loadTilesWhileAnimating: false,
            view: new ol.View({
                zoom: 15,
                center: ol.proj.transform([5.347022, 45.419364], 'EPSG:4326', 'EPSG:3857')
            })
        });

        /**
         * Rustine, permet d'eviter les cartes blanches sur mobile en attendant de trouver la vrai raison
         */
        if (this.deviceService.isMobile) {
            map.on(Events.OL_MAP_POSTRENDER, (event: ol.MapBrowserEvent) => {
                const canva = document.getElementsByTagName('canvas')[0];
                const reload = document.location.href.endsWith('map') && canva && canva.style.display === 'none';
                if (reload) {
                    event.map.updateSize();
                }
            });
        }

        this.layerBoxes.map(layerBox => map.addLayer(layerBox.layer));

        // add slider
        if (this.deviceService.isMobile()) {
            $('.ol-zoom-in').css('display', 'none');
            $('.ol-zoom-out').css('display', 'none');
        }
        this.map = map;
        this.eventService.call(Events.MAP_STATE_LOADED, map);
        this.eventService.call(Events.MAP_MOVE_CURRENT);
        if (this.deviceService.isMobile()) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    this.eventService.call(
                        Events.MAP_MOVE,
                        {
                            lat: position.coords.latitude, lng: position.coords.longitude
                        }
                    );
                },
                error => this.log.error('[MapService] Error while getting current position: ' + JSON.stringify(error)),
                {
                    enableHighAccuracy: true
                }
            );
        }
    }

    getBingLayer(key: string, type: string, opacity: number, visible: boolean) {
        const l = new ol.layer.Tile(
            {
                visible: visible,
                opacity: opacity,
                preload: Infinity,
                source: new ol.source.BingMaps({
                    key: 'AkI1BkPAQ-KOw7uZLelGWgLQ5Vbxq7-5K8p-2oMsMuboW8wGBMKA6T63GJ1nJVFK',
                    imagerySet: type
                })
            });
        l.set('id', key);
        return l;
    }

    getGoogleLayer(key: string, type: string, opacity: number, visible: boolean) {
        const l = new ol.layer.Tile(
            {
                visible: visible,
                opacity: opacity,
                preload: Infinity,
                source: new ol.source.XYZ({
                    url: `https://mt0.google.com/vt/lyrs=${type}&hl=en&x={x}&y={y}&z={z}&s=Ga`,
                    attributions: SETTINGS.VERSION
                })
            });
        l.set('id', key);
        return l;
    }

    getOsmLayer(key: string, opacity: number, visible: boolean) {
        const l = new ol.layer.Tile(
            {
                visible: visible,
                opacity: opacity,
                source: new ol.source.OSM(
                    {attributions: SETTINGS.VERSION}
                )
            });
        l.set('id', key);
        return l;
    }

    getIgnLayer(key: string, type: string, opacity: number, visible: boolean): ol.layer.Base {
        const resolutions = [];
        const matrixIds = [];
        const proj3857 = ol.proj.get('EPSG:3857');
        const maxResolution = ol.extent.getWidth(proj3857.getExtent()) / 256;

        for (let i = 0; i < 18; i++) {
            matrixIds[i] = i.toString();
            resolutions[i] = maxResolution / Math.pow(2, i);
        }

        const tileGrid = new ol.tilegrid.WMTS({
            origin: [-20037508, 20037508],
            resolutions: resolutions,
            matrixIds: matrixIds
        });

        // API key valid for 'openlayers.org' and 'localhost'.
        // Expiration date is 06/29/2018.
        const apiKey = '6i88pkdxubzayoady4upbkjg';

        const ign_source = new ol.source.WMTS({
            url: 'https://wxs.ign.fr/' + apiKey + '/wmts',
            layer: type,
            matrixSet: 'PM',
            format: 'image/jpeg',
            projection: 'EPSG:3857',
            tileGrid: tileGrid,
            style: 'normal',
            attributions: SETTINGS.VERSION + ' <a href="http://www.geoportail.fr/" target="_blank">' +
                '<img src="https://api.ign.fr/geoportail/api/js/latest/' +
                'theme/geoportal/img/logo_gp.gif"></a>',
            crossOrigin: ''
        });

        const ign = new ol.layer.Tile({
            opacity: opacity,
            visible: visible,
            source: ign_source
        });
        ign.set('id', key);

        return ign;
    }

    getLayer(map: ol.Map, id): ol.layer.Base {
        let layer;
        map.getLayers().forEach(function (lyr) {
            if (id === lyr.get('id')) {
                layer = lyr;
            }
        });
        return layer;
    }

    saveOpacity() {
        this.user.subscribe(
            (user) => {
                this.layerBoxes.forEach(layerBox => {
                    let mapBox = user.mapBoxes.find(m => layerBox.key === m.key);
                    if (!mapBox) {
                        mapBox = new MapBox(layerBox.key, layerBox.layer.getOpacity(), layerBox.layer.getVisible());
                        user.mapBoxes.push(mapBox);
                    }
                    mapBox.opacity = layerBox.layer.getOpacity();
                    mapBox.visible = layerBox.layer.getVisible();
                });
                this.log.info('[MapService] sending settings to the server');
                this.userService.update(user).subscribe(
                    () => this.log.success('[MapService] settings saved on the server'),
                    (error) => this.log.error('[MapService] error while sending settings on the server:' + JSON.stringify(error))
                );
            },
            (error) => this.log.error('[MapService] error while getting current user:' + JSON.stringify(error))
        );
    }

    setOpacity(layerBox: LayerBox, opacity: number) {
        layerBox.layer.setVisible(opacity !== 0);
        layerBox.layer.setOpacity(opacity);
    }

    ngOnDestroy() {
    }
}

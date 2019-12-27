import * as ol from 'openlayers';
import {CaniDraw} from './caniDraw';

export interface CaniDrawPolygonOptions extends ol.olx.style.StyleOptions {
    fillOptions?: ol.olx.style.FillOptions;
    strokeOptions?: ol.olx.style.StrokeOptions;
}

export class CaniDrawPolygon extends CaniDraw {
    geometry: ol.geom.GeometryType = 'Polygon';
    style: (color?: string) => CaniDrawPolygonOptions;

    constructor(type: string, helper: string, style?: (color?: string) => CaniDrawPolygonOptions) {
        super(type, helper, style);
        this.style = style;
    }
}

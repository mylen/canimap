import {Injectable} from '@angular/core';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subscription} from 'rxjs/Subscription';
import {LogService} from './log.service';
import {Events} from '../_consts/events';

@Injectable()
export class EventService {

    state = Events.MAP_MOVE;
    // Observable string sources
    onEventSource: Map<string, ReplaySubject<any>> = new Map();

    constructor(
        private log: LogService
    ) {
    }

    subscribe(key: string, next?: (value: any) => void, error?: (error: any) => void, complete?: () => void): Subscription {
        this.log.debug('[EventService] [subscribe] ' + key);
        return this.getEvent(key).asObservable().subscribe(next, error, complete);
    }

    call(key: string, value?: any) {
        this.log.debug('[EventService] [call] ' + key);
        this.state = key;
        this.getEvent(key).next(value);
    }

    private getEvent(key: string): ReplaySubject<any> {
        let source = this.onEventSource.get(key);
        if (!source) {
            source = new ReplaySubject(1);
            this.onEventSource.set(key, source);
        }
        return source;
    }
}

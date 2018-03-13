﻿import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'app-canimap-menu',
  moduleId: module.id.toString(),
  templateUrl: 'menu.component.html'
})

export class MenuComponent implements OnInit {
  deviceInfo = null;

  get displayMap() {
    return (this.router.url === '/map');
  }

  get isMapVisible() {
    return this.router.url === '/map';
  }

  get isMobileApp() {
    return this.deviceService.isMobile();
  }

  get isRegisterVisible() {
    return this.router.url === '/register';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deviceService: DeviceDetectorService
  ) {
    this.deviceInfo = this.deviceService.getDeviceInfo();
  }

  ngOnInit() {
  }
}

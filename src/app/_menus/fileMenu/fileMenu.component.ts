﻿import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuEventService, HelperEventService } from '../../_services/index';

@Component({
  selector: 'app-canimap-file-menu',
  moduleId: module.id.toString(),
  templateUrl: 'fileMenu.component.html'
})

export class FileMenuComponent implements OnInit {
  model: any = {};
  loading = false;

  constructor(
    private menuEventService: MenuEventService,
    private helperEventService: HelperEventService,
    private router: Router
  ) { }

  get visible(): boolean {
    return this.router.url === '/map';
  }

  ngOnInit() {
  }

  fileSave(e: MouseEvent) {
    this.menuEventService.prepareEvent('fileSave', null);
    this.helperEventService.showHelper('fileSave', () => {
      this.menuEventService.proceed();
    });
  }

  filesOpen(e: MouseEvent) {
    this.menuEventService.prepareEvent('filesOpen', null);
    this.helperEventService.showHelper('filesOpen', () => {
      this.menuEventService.proceed();
    });
  }

  gpx(e: MouseEvent) {
    this.menuEventService.prepareEvent('fileOpen', null);
    this.helperEventService.showHelper('loadGPX', () => {
      this.menuEventService.proceed();
    });
  }
}

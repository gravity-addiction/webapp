import { Component, OnInit } from '@angular/core';
import * as Chartist from 'chartist';
import { Subscription, ObjectUnsubscribedError } from 'rxjs';

import { SysInfoService } from '../_services/sys-info.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  sysInfo: any = {};

  constructor(
    private sysInfoService: SysInfoService
  ) { }

  ngOnInit() {
    this.sysInfo.static$ = this.sysInfoService.getSysCall('staticInfo', 'local');
    this.sysInfo.cpu$ = this.sysInfoService.getSysCall('cpuInfo', 'local');
    this.sysInfo.memory$ = this.sysInfoService.getSysCall('memInfo', 'local');
    this.sysInfo.disk$ = this.sysInfoService.getSysCall('diskInfo', 'local');
    this.sysInfo.network$ = this.sysInfoService.getSysCall('networkInfo', 'local');
  }

}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, of, Subscription } from 'rxjs';
import * as urljoin from 'url-join';

import { CacheService } from 'app/_services/cache.service';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {

  private _sysCalls = {
    playlist: {
      init: false,
      url: '/spotify/v1/me/playlists',
      sub: new BehaviorSubject<any>(null)
    },
    songs: {
      init: true,
      url: '/spotify/v1/playlists/{playlist_id}/tracks',
      sub: new BehaviorSubject<any>(null)
    },
  };

  constructor(
    private _http: HttpClient,
    private _cacheService: CacheService
  ) {

    this._cacheService.apiDevice$.subscribe(() => {
      const sysKeys = Object.keys(this._sysCalls),
            sysI = sysKeys.length;

      for (let i = 0; i < sysI; i++) {
        if (this._sysCalls[sysKeys[i]].init) { this._sysCalls[sysKeys[i]].sub.next(null); }
        this._sysCalls[sysKeys[i]].init = false;
      }
    });

  }

  public saveDevKeys(client_id, client_secret) {
    const apiUrl = (this._cacheService.apiUrls || []).find((a) => a.device === this._cacheService.apiDevice);
    if (!apiUrl) {
      console.log('No Device Defined For', this._cacheService.apiDevice, 'in apiUrls Cache Service');
      return;
    }

    return this._http.put(
      urljoin(apiUrl.url, '/spotify/developer_keys'),
      {
        client_id: client_id,
        client_secret: client_secret
      }
    );
  }

  public changeSongList(playlist_id) {
    this._sysCalls.songs.url = `/spotify/v1/playlists/${playlist_id}/tracks`;
    this.refreshSysCall('songs', true);
  }

  public playuri(uris, device) {
    const apiUrl = (this._cacheService.apiUrls || []).find((a) => a.device === this._cacheService.apiDevice);
    if (!apiUrl) {
      console.log('No Device Defined For', this._cacheService.apiDevice, 'in apiUrls Cache Service');
      return;
    }

    const opts: any = {};

    // Song URI
    if (Array.isArray(uris)) {
      opts.uris = uris;
    } else { opts.uris = [uris]; }
    
    return this._http.put(
      urljoin(apiUrl.url, '/spotify/v1/me/player/play') + '?device_id=' + encodeURIComponent(device),
      opts
    );
  }

  public playcontext(uri, device) {
    const apiUrl = (this._cacheService.apiUrls || []).find((a) => a.device === this._cacheService.apiDevice);
    if (!apiUrl) {
      console.log('No Device Defined For', this._cacheService.apiDevice, 'in apiUrls Cache Service');
      return;
    }

    return this._http.put(
      urljoin(apiUrl.url, '/spotify/v1/me/player/play') + '?device_id=' + encodeURIComponent(device),
      {context_uri: uri }
    );
  }  


  public getSysCall(syscall) {
    if (!this._sysCalls.hasOwnProperty(syscall)) { return of(null); }
    return this._sysCalls[syscall].sub;
  }

  public sortSysCall(syscall, sortby) {
    const sysCall = this._sysCalls[syscall];
    sysCall.sortField = sortby;
    if (sysCall.hasOwnProperty('sort')) {
      sysCall.sort(sysCall.sub.value);
    }
  }

  public refreshSysCall(syscall, force = false) {
    const apiUrl = (this._cacheService.apiUrls || []).find((a) => a.device === this._cacheService.apiDevice);
    if (!apiUrl) {
      console.log('No Device Defined For', this._cacheService.apiDevice, 'in apiUrls Cache Service');
      return;
    }
    const sysCall = this._sysCalls[syscall];
    if (!sysCall) {
      console.log('No System Call', syscall);
      return;
    }

    // don't reup if initilized, unless forced
    if (sysCall.init && !force) { return; }
    // Clean subject initialized and forced
    if (sysCall.init && force) { sysCall.sub.next(null); }

    sysCall.init = true;

    // kill old subscription;
    try { if (sysCall.$) { sysCall.$.unsubscribe(); } } catch(e) { }
    
    // make call
    sysCall.$ = this._http.get(
      urljoin(apiUrl.url, sysCall.url),
      // { headers: new HttpHeaders({ timeout: `${25000}` }) }
    ).
    subscribe(data => {
      // Post Data manipulations
      if (sysCall.hasOwnProperty('post')) {
        data = sysCall.post(data);
      }

      // Sorting Data
      if (sysCall.hasOwnProperty('sort')) {
        data = sysCall.sort(data);
      }

      sysCall.sub.next(data);
    });
  }
}
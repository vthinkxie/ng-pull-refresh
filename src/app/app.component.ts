import { Component } from '@angular/core';
import { EMPTY, fromEvent, interval, merge, Subject } from 'rxjs';
import { debounceTime, filter, map, repeat, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface User {
  address: string;
  balance: number;
  created: string;
  email: string;
  first: string;
  last: string;
}
@Component({
  selector: 'app-root',
  template: `
    <button (click)="click$.next()">Refresh</button>
    <input id="auto" type="checkbox" ngModel (ngModelChange)="change$.next($event)" />
    <label for="auto">Enable Auto Refresh</label>
    <section *ngFor="let user of view$ | async">
      <hr>
      <div>Name: {{ user.first }} {{ user.last }}</div>
      <div>Address: {{ user.address }}</div>
      <div>Balance: {{ user.balance }}</div>
      <div>Email: {{ user.email }}</div>
    </section>
  `
})
export class AppComponent {
  click$ = new Subject<void>();
  change$ = new Subject<boolean>();
  touchstart$ = fromEvent<TouchEvent>(document, 'touchstart');
  touchend$ = fromEvent<TouchEvent>(document, 'touchend');
  touchmove$ = fromEvent<TouchEvent>(document, 'touchmove');
  interval$ = interval(5000);
  fetch$ = this.httpClient.get<User[]>('https://randomapi.azurewebsites.net/api/users');
  clickRefresh$ = this.click$.pipe(debounceTime(300));
  touchRefresh$ = this.touchstart$.pipe(
    switchMap(touchstart =>
      this.touchmove$.pipe(
        map(touchmove => touchmove.touches[0].pageY - touchstart.touches[0].pageY),
        takeUntil(this.touchend$)
      )
    ),
    filter(position => position >= 300),
    take(1),
    repeat()
  );
  autoRefresh$ = this.change$.pipe(switchMap(enabled => (enabled ? this.interval$ : EMPTY)));
  refresh$ = merge(this.clickRefresh$, this.autoRefresh$, this.touchRefresh$).pipe(startWith(true));
  view$ = this.refresh$.pipe(switchMap(() => this.fetch$));
  constructor(private httpClient: HttpClient) {}
}

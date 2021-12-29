import {
  AfterViewInit,
  Component,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  concatMap,
  defer,
  from,
  interval,
  map,
  observeOn,
  range,
  animationFrameScheduler,
  takeWhile,
  tap,
} from 'rxjs';

/**
 *
 * From Scheduler source code:
 *
 * @property {Scheduler} queue Schedules on a queue in the current event frame
 * (trampoline scheduler). Use this for iteration operations.
 * @property {Scheduler} asap Schedules on the micro task queue, which uses the
 * fastest transport mechanism available, either Node.js' `process.nextTick()`
 * or Web Worker MessageChannel or setTimeout or others. Use this for
 * asynchronous conversions.
 * @property {Scheduler} async Schedules work with `setInterval`. Use this for
 * time-based operations.
 * @property {Scheduler} animationFrame Schedules work with `requestAnimationFrame`.
 * Use this for synchronizing with the platform's painting
 */

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChildren('myImg') imgs: QueryList<any>;

  myRange$ = range(0, Number.POSITIVE_INFINITY).pipe(
    observeOn(animationFrameScheduler)
  );

  myInterval$ = interval(0, animationFrameScheduler);

  msElapsed = ({ scheduler = animationFrameScheduler, maxTimeInSecond = 5 }) =>
    defer(() => {
      const starting = scheduler.now();
      return interval(0, scheduler).pipe(
        map((myInt) => scheduler.now() - starting),
        takeWhile(() => scheduler.now() - starting < maxTimeInSecond * 1000)
      );
    });

  distanceInPixel = (v) => (ms) => (v * ms) / 1000;

  fall = ({ speed = 50, maxTimeInSecond = 2 }) =>
    this.msElapsed({ maxTimeInSecond }).pipe(map(this.distanceInPixel(speed)));

  log = (r) => console.log(r);

  duration = (ms = 5000, scheduler = animationFrameScheduler) =>
    defer(() => {
      const starting = scheduler.now();
      return interval(0, scheduler).pipe(
        map((myInt) => {
          let elapsed = scheduler.now() - starting;
          return elapsed / ms;
        }),
        takeWhile((t) => t <= 1)
      );
    });

  distance = (distance) => (percent) => percent * distance;

  moveDown = (myElem) => (duration$) =>
    duration$.pipe(
      map(this.distance(500)),
      tap((t) => (myElem.nativeElement.style.transform = `translateY(${t}px)`))
    );

  ngOnInit() {}

  ngAfterViewInit() {
    // AS velocity:
    //   fall({speed:50,maxTimeInSecond:5}).subscribe(
    //     r => this.myTranslation = `translateY(${r}px)`;
    // )

    // AS duration (wary better):
    //const moveImg = this.moveDown(this.myImg);

    //First way to do it:
    //moveDown(this.myImg)(duration(2000)).subscribe(r => console.log(r))
    //But better with "LET ME HAVE THE WHOLE OBSERVABLE"
    //duration(2000)
    //  .let(this.moveDown(this.myImg))
    //  .subscribe(log)

    //same thing but with multiple references:
    // console.log(this.imgs)

    from(this.imgs.toArray())
      .pipe(
        concatMap(
          (myImg, index) => this.duration(400 * (index + 1)),
          (source) => this.moveDown(source)
        )
      )
      .subscribe();
    //.subscribe(this.log)
  }
}

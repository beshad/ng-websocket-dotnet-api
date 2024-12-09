import { RouterOutlet } from '@angular/router';
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { catchError, Subscription, tap } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import am5index from '@amcharts/amcharts5/index';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5radar from '@amcharts/amcharts5/radar';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  private root: am5.Root;
  chart: am5xy.XYChart;
  series: am5xy.ColumnSeries;
  xAxis: any;

  private socket$!: WebSocketSubject<any>;
  private subscription!: Subscription;

  data: { value: number; time: string }[] = [];

  browserOnly(f: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        f();
      });
    }
  }

  initChart() {
    this.root.setThemes([am5themes_Animated.new(this.root)]);

    this.chart = this.root.container.children.push(
      am5xy.XYChart.new(this.root, {
        panY: false,
        layout: this.root.verticalLayout,
      })
    );

    let yAxis = this.chart.yAxes.push(
      am5xy.ValueAxis.new(this.root, {
        renderer: am5xy.AxisRendererY.new(this.root, {}),
      })
    );

    yAxis.children.push(
      am5.Label.new(this.root, {
        rotation: -90,
        text: 'value',
        y: am5.p50,
        centerX: am5.p50,
        centerY: am5.p50,
        fontSize: '20px',
        // fill: am5.color(0xff3333),
      })
    );

    yAxis.get('renderer').labels.template.set('fill', am5.color(0x000000));

    this.xAxis = this.chart.xAxes.push(
      am5xy.CategoryAxis.new(this.root, {
        renderer: am5xy.AxisRendererX.new(this.root, {
          minGridDistance: 10,
        }),
        maxDeviation: 0.3,
        categoryField: 'time',
      })
    );

    this.xAxis.get('renderer').labels.template.setAll({
      rotation: 90, 
      centerX: am5.p50,
      centerY: am5.p100, 
      horizontalCenter: am5.p100, 
    });

    this.xAxis.get('renderer').labels.template.setAll({
      fill: am5.color(0x000000),
      fontSize: '12px',
    });
    this.xAxis.children.push(
      am5.Label.new(this.root, {
        text: 'time',
        x: am5.p50,
        centerX: am5.p50,
        centerY: am5.p50,
        fontSize: '20px',
        fill: am5.color(0x000000),
        // fill: am5.color(0xff3333),
      })
    );

    this.series = this.chart.series.push(
      am5xy.ColumnSeries.new(this.root, {
        name: 'Websocket example chart',
        xAxis: this.xAxis,
        yAxis: yAxis,
        valueYField: 'value',
        sequencedInterpolation: true,
        categoryXField: 'time',
        tooltip: am5.Tooltip.new(this.root, {
          labelText: '{valueY}',
        }),
      })
    );
    this.xAxis.data.setAll(this.data);
    this.series.data.setAll(this.data);

    this.series.appear(1000);
    this.chart.appear(1000, 100);
  }

  ngAfterViewInit() {
    this.root = am5.Root.new('chart');
    this.browserOnly(() => {
      this.initChart();
    });
  }

  ngOnInit() {
    this.socket$ = webSocket('ws://localhost:5000/ws');

    this.subscription = this.socket$
      .pipe(
        tap((data) => {
          this.data.push(data);
          this.xAxis.data.setAll(this.data);
          this.series.data.setAll(this.data);
        }),
        catchError((error) => {
          console.error('WebSocket error:', error);
          return error;
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.socket$.complete();
    }
    this.browserOnly(() => {
      if (this.root) {
        this.root.dispose();
      }
    });
  }
}

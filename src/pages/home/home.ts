import { Component, ViewChild } from '@angular/core';
import { NavController, ToastController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { AngularFireList } from 'angularfire2/database/interfaces';
import { AngularFireDatabase } from 'angularfire2/database';
import { Chart } from 'chart.js';

export interface Item {
  value: number;
  expense: boolean;
  month: number;
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  data: Observable<any[]>;
  ref: AngularFireList<any>;
  
  months = [
    {value: 0, name: 'January'},
    {value: 1, name: 'February'},
    {value: 2, name: 'March'},
    {value: 3, name: 'April'},
  ];
  transaction: Item = {
    value: 0,
    expense: false,
    month: 0
  };

  @ViewChild('valueBarsCanvas') valueBarCanvas;
  valueBarsChart: any;

  chartData = null;

  constructor(public navCtrl: NavController, private db: AngularFireDatabase, private toastCtrl: ToastController) {

  }

  ionViewDidLoad() {
    this.ref = this.db.list<Item>('transactions', ref => ref.orderByChild('month'));
    this.ref.valueChanges().subscribe(result => {
      if(this.chartData) {
        this.updateCharts(result);
      } else {
        this.createCharts(result);
      }
    });
  }
  addTransaction() {
    this.ref.push(this.transaction).then(() => {
      this.transaction = {
        value: 0,
        expense: false,
        month: 0
      };

      let toast = this.toastCtrl.create({
        message: 'new Transaction added',
        duration: 3000
      });
      toast.present();
    });
  }
  getReportValues() {
    let reportByMonth = {
      0: null,
      1: null,
      2: null,
      3: null
    };
    for(let trans of this.chartData) {
      if(reportByMonth[trans.month]) {
        if(trans.expense) {
          reportByMonth[trans.month] -= +trans.value;
        } else {
          reportByMonth[trans.month] += +trans.value;
        }
      } else {
        if(trans.expense) {
          reportByMonth[trans.month] = 0 - +trans.value;
        } else {
          reportByMonth[trans.month] = +trans.value;
        }
      }
    }
    return Object.keys(reportByMonth).map(a => reportByMonth[a]);
  }
  createCharts(data) {
    this.chartData = data;

    let chartData = this.getReportValues();
    console.log('my array: ', chartData);

    this.valueBarsChart = new Chart(this.valueBarCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: Object.keys(this.months).map(a => this.months[a].name),
        datasets: [
          {
            data: chartData,
            backgroundColor: '#32db64'
          }
        ]
      },
      options: {
        legend: {
          display: false
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItems, data) {
              return data.datasets[tooltipItems.datasetIndex].data[tooltipItems.index]+'$';

            }
          }
        },


      }
    })
  }
  updateCharts(data) {
    this.chartData = data;
    let chartData = this.getReportValues();
    this.valueBarsChart.data.datasets.forEach((dataset) => {
      dataset.data = chartData;
    })
    this.valueBarsChart.update();
  }

}

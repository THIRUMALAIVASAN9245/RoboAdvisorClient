import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, ValidatorFn } from '@angular/forms';
import { RoboAdviser } from '../../models/RoboAdviser';
import { FastApiService } from '../../services/fastapi.service';
import * as XLSX from 'xlsx';
type AOA = any[][];
import { HttpClient } from "@angular/common/http";
import { TrainParams } from 'src/app/models/trainParams';

@Component({
  selector: 'predict-component',
  templateUrl: './predict.component.html',
  styleUrls: ['./predict.component.css']
})

export class PredictComponent {
  locations: string[] = ['Thanjavur', 'Salem', 'Chennai'];
  sexes: string[] = ['FEMALE', 'MALE'];
  smokers: any[] = [
    { id: 1, name: "Yes" },
    { id: 0, name: "No" }
  ];
  spicies: string[] = ['Basic', 'Standard', 'Premium'];
  data: AOA = [[1, 2], [3, 4]];
  wopts: XLSX.WritingOptions = { bookType: 'xlsx', type: 'array' };
  fileName: string = 'SheetJS.xlsx';

  prediction = this.spicies[0];
  RoboAdviser = new RoboAdviser(this.locations[0], 0, 1, 0, 0, this.sexes[0], this.spicies[0]);
  availableTrainedData: RoboAdviser[] = [];

  models: string[] = ['SVM', 'Decision Tree', 'Random Forest', 'Logistic Regression'];
  modelAccuracy = 0.0;
  trainParams = new TrainParams(this.models[2], './data/RoboAdvisers_size.csv', 0.2);

  constructor(
    private _fastApiService: FastApiService,
    private http: HttpClient
  ) {

    console.log(this.trainParams);
    this._fastApiService.train(this.trainParams).subscribe(
      response => {
        this.modelAccuracy = response
        console.log(response);
      }
    );

    this.http.get('assets/RoboAdvisers_size.csv', { responseType: 'text' })
      .subscribe(
        data => {
          let csvToRowArray = data.split("\n");
          for (let index = 1; index < csvToRowArray.length - 1; index++) {
            let row = csvToRowArray[index].split(",");
            this.availableTrainedData.push(new RoboAdviser(row[1], parseInt(row[2]), parseInt(row[3]), parseInt(row[4]),
              parseInt(row[5]), row[6], row[0]));
          }
          console.log(this.availableTrainedData);
        },
        error => {
          console.log(error);
        }
      );
  }

  public onPredict(): void {
    console.log(this.RoboAdviser);
    this._fastApiService.predict(this.RoboAdviser).subscribe(
      response => this.prediction = response
    );
  }

  public getTrainedData(): void {

  }

  onSelect(smokerId: any) {
    this.RoboAdviser.smoker = smokerId.target.value;
  }

  export(): void {
    /* generate worksheet */
    const result = this.availableTrainedData as any;
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(result);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, this.fileName);
  }
}
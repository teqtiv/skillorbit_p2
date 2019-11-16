import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-survey',
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.css']
})
export class SurveyComponent implements OnInit {
  choices: string[] = [
    'Strongly Agree',
    'Somewhat Agree',
    'Neutral',
    'Disagree'
  ];

  constructor() {}

  ngOnInit() {}
  redirectToHome() {
    window.location.href = '';
  }
}

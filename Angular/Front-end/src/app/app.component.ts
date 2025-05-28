import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/shared/header/header.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { LoadingSpinnerComponent } from './components/shared/loading-spinner/loading-spinner.component';
import { PageTransitionService } from './services/page-transition.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, LoadingSpinnerComponent],
  template: `
    <app-header></app-header>
    <app-loading-spinner *ngIf="pageTransitionService.loading$ | async" [overlay]="true" message="Loading..."></app-loading-spinner>
    <main [class.content-loading]="pageTransitionService.loading$ | async">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'E-Shop';
  
  constructor(public pageTransitionService: PageTransitionService) {}
  
  ngOnInit() {
    // Ensure CSS variables are properly loaded
    this.initializeColorVariables();
  }
  
  private initializeColorVariables() {
    // Convert hex to RGB for CSS variables
    const convertHexToRGB = (hex: string): string => {
      // Remove the # if present
      hex = hex.replace('#', '');
      
      // Parse the hex values
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      return `${r}, ${g}, ${b}`;
    };
    
    // Set RGB variables for all colors
    const rootStyle = document.documentElement.style;
    
    // Primary colors
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#3f51b5';
    const primaryLight = getComputedStyle(document.documentElement).getPropertyValue('--primary-light').trim() || '#757de8';
    const primaryDark = getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim() || '#002984';
    
    // Secondary colors
    const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim() || '#ff4081';
    const secondaryLight = getComputedStyle(document.documentElement).getPropertyValue('--secondary-light').trim() || '#ff79b0';
    const secondaryDark = getComputedStyle(document.documentElement).getPropertyValue('--secondary-dark').trim() || '#c60055';
    
    // Other colors
    const successColor = getComputedStyle(document.documentElement).getPropertyValue('--success-color').trim() || '#4caf50';
    const warningColor = getComputedStyle(document.documentElement).getPropertyValue('--warning-color').trim() || '#ff9800';
    const dangerColor = getComputedStyle(document.documentElement).getPropertyValue('--danger-color').trim() || '#f44336';
    const infoColor = getComputedStyle(document.documentElement).getPropertyValue('--info-color').trim() || '#2196f3';
    
    // Set RGB values
    rootStyle.setProperty('--primary-color-rgb', convertHexToRGB(primaryColor));
    rootStyle.setProperty('--primary-light-rgb', convertHexToRGB(primaryLight));
    rootStyle.setProperty('--primary-dark-rgb', convertHexToRGB(primaryDark));
    rootStyle.setProperty('--secondary-color-rgb', convertHexToRGB(secondaryColor));
    rootStyle.setProperty('--secondary-light-rgb', convertHexToRGB(secondaryLight));
    rootStyle.setProperty('--secondary-dark-rgb', convertHexToRGB(secondaryDark));
    rootStyle.setProperty('--success-color-rgb', convertHexToRGB(successColor));
    rootStyle.setProperty('--warning-color-rgb', convertHexToRGB(warningColor));
    rootStyle.setProperty('--danger-color-rgb', convertHexToRGB(dangerColor));
    rootStyle.setProperty('--info-color-rgb', convertHexToRGB(infoColor));
    
    // Gray colors
    for (let i = 100; i <= 900; i += 100) {
      const grayVar = `--gray-${i}`;
      const grayColor = getComputedStyle(document.documentElement).getPropertyValue(grayVar).trim();
      if (grayColor) {
        rootStyle.setProperty(`${grayVar}-rgb`, convertHexToRGB(grayColor));
      }
    }
  }
}

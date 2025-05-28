import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container" [class.overlay]="overlay">
      <div class="spinner">
        <div class="double-bounce1"></div>
        <div class="double-bounce2"></div>
      </div>
      <p *ngIf="message" class="spinner-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.8);
      z-index: 9999;
    }
    
    .spinner {
      width: 60px;
      height: 60px;
      position: relative;
      margin: 20px auto;
    }
    
    .double-bounce1, .double-bounce2 {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: var(--primary-color, #3f51b5);
      opacity: 0.6;
      position: absolute;
      top: 0;
      left: 0;
      animation: sk-bounce 2.0s infinite ease-in-out;
    }
    
    .double-bounce2 {
      background-color: var(--secondary-color, #ff4081);
      animation-delay: -1.0s;
    }
    
    .spinner-message {
      margin-top: 15px;
      color: var(--gray-700, #495057);
      font-weight: 500;
      text-align: center;
    }
    
    @keyframes sk-bounce {
      0%, 100% { 
        transform: scale(0.0);
      } 
      50% { 
        transform: scale(1.0);
      }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() overlay = false;
  @Input() message = '';
} 
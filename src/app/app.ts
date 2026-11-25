import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('shiduchim-app');
  protected readonly chatOpen = signal(false);
  protected readonly loading = signal(false);
  protected chatInput = '';
  protected readonly messages = signal<ChatMessage[]>([
    { role: 'assistant', text: 'שלום! אני העוזר שלך למערכת ניהול הצעות השידוכים. איך אפשר לעזור?' }
  ]);

  constructor(private http: HttpClient) {}

  protected toggleChat(): void {
    this.chatOpen.update(open => !open);
  }

  protected sendMessage(): void {
    const text = this.chatInput.trim();
    if (!text || this.loading()) return;

    this.messages.update(items => [...items, { role: 'user', text }]);
    this.chatInput = '';
    this.loading.set(true);

    this.http.post<{ reply: string }>('/api/chat', { message: text }).subscribe({
      next: response => {
        this.messages.update(items => [...items, { role: 'assistant', text: response.reply }]);
        this.loading.set(false);
      },
      error: error => {
        const message = error?.error?.error || 'הצ\'אט אינו זמין כרגע. נסו שוב.';
        this.messages.update(items => [...items, { role: 'assistant', text: message }]);
        this.loading.set(false);
      }
    });
  }
}

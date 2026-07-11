import { Component, Input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-graphique-ligne',
  templateUrl: './graphique-ligne.component.html',
  styleUrls: ['./graphique-ligne.component.scss']
})
export class GraphiqueLigneComponent implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  @Input() label: string = '';
  @Input() color: string = '#3B82F6';

  ngAfterViewInit(): void {
    this.render();
  }

  private render(): void {
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx) return;
    const width = this.canvas.nativeElement.parentElement?.clientWidth || 400;
    const height = 250;
    this.canvas.nativeElement.width = width;
    this.canvas.nativeElement.height = height;

    const padding = 40;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;
    const max = Math.max(...this.data, 1);
    const stepX = chartW / Math.max(this.data.length - 1, 1);

    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    for (let i = 0; i < this.data.length; i++) {
      const x = padding + i * stepX;
      const y = padding + chartH - (this.data[i] / max) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Dots
    ctx.fillStyle = this.color;
    for (let i = 0; i < this.data.length; i++) {
      const x = padding + i * stepX;
      const y = padding + chartH - (this.data[i] / max) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.floor(this.labels.length / 6));
    for (let i = 0; i < this.labels.length; i += labelStep) {
      const x = padding + i * stepX;
      ctx.fillText(this.labels[i], x, height - 10);
    }
  }
}

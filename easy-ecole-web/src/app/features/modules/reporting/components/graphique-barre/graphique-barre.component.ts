import { Component, Input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-graphique-barre',
  template: `<canvas #canvas></canvas>`
})
export class GraphiqueBarreComponent implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  @Input() label: string = '';
  @Input() color: string = '#10B981';

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
    const barW = Math.min(40, chartW / this.data.length * 0.6);
    const gap = chartW / this.data.length;

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

    // Bars
    ctx.fillStyle = this.color;
    for (let i = 0; i < this.data.length; i++) {
      const x = padding + i * gap + (gap - barW) / 2;
      const h = (this.data[i] / max) * chartH;
      const y = padding + chartH - h;
      ctx.fillRect(x, y, barW, h);
    }

    // Labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.floor(this.labels.length / 6));
    for (let i = 0; i < this.labels.length; i += labelStep) {
      const x = padding + i * gap + gap / 2;
      ctx.fillText(this.labels[i], x, height - 10);
    }
  }
}

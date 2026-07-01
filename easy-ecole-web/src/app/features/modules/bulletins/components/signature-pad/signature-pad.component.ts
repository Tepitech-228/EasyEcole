import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-signature-pad',
  template: `
    <div class="bg-white rounded-xl border border-gray-200 shadow-lg p-4">
      <p class="text-sm font-semibold text-gray-900 mb-2">{{ label }}</p>
      <canvas #canvas
        (mousedown)="startDrawing($event)"
        (mousemove)="draw($event)"
        (mouseup)="stopDrawing()"
        (mouseleave)="stopDrawing()"
        (touchstart)="onTouchStart($event)"
        (touchmove)="onTouchMove($event)"
        (touchend)="onTouchEnd()"
        class="border border-gray-200 rounded-lg w-full cursor-crosshair touch-none"
        [style.height.px]="height"
        style="background:#fff">
      </canvas>
      <div class="flex items-center justify-between mt-3">
        <button type="button" (click)="clear()"
          class="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border-0 cursor-pointer">
          Effacer
        </button>
        <div class="flex items-center gap-2">
          <button type="button" (click)="cancel.emit()"
            class="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border-0 cursor-pointer">
            Annuler
          </button>
          <button type="button" (click)="save()"
            class="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors border-0 cursor-pointer">
            Valider la signature
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @Input() label: string = 'Signature';
  @Input() height: number = 150;
  @Input() existingSignature: string | null = null;
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private drawing: boolean = false;
  private hasDrawn: boolean = false;

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width - 32;
    canvas.height = this.height;

    this.ctx = canvas.getContext('2d')!;
    this.ctx.strokeStyle = '#1e3a5f';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (this.existingSignature) {
      const img = new Image();
      img.onload = () => this.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = this.existingSignature;
    }
  }

  ngOnDestroy() {}

  private getPos(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  startDrawing(e: MouseEvent) {
    this.drawing = true;
    this.hasDrawn = true;
    const pos = this.getPos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  draw(e: MouseEvent) {
    if (!this.drawing) return;
    const pos = this.getPos(e);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  }

  stopDrawing() {
    this.drawing = false;
  }

  onTouchStart(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    this.hasDrawn = true;
    this.drawing = true;
    const pos = this.getPos(touch);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  onTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (!this.drawing) return;
    const touch = e.touches[0];
    const pos = this.getPos(touch);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  }

  onTouchEnd() {
    this.drawing = false;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    this.hasDrawn = false;
  }

  save() {
    if (!this.hasDrawn && !this.existingSignature) return;
    const dataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
    this.confirm.emit(dataUrl);
  }
}

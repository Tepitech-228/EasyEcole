import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

@Component({
    selector: 'app-signature-modal',
    templateUrl: './signature-modal.component.html',
    styleUrls: ['./signature-modal.component.scss']
})
export class SignatureModalComponent {
    @ViewChild('signatureCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>
    @Output() onConfirm = new EventEmitter<string>()
    @Output() onClose = new EventEmitter<void>()

    show: boolean = false
    private ctx!: CanvasRenderingContext2D
    private drawing = false

    open(): void {
        this.show = true
        setTimeout(() => this.initCanvas(), 100)
    }

    close(): void {
        this.show = false
        this.onClose.emit()
    }

    private initCanvas(): void {
        const canvas = this.canvasRef.nativeElement
        this.ctx = canvas.getContext('2d')!
        this.ctx.strokeStyle = '#000'
        this.ctx.lineWidth = 2
        this.ctx.lineCap = 'round'
        this.ctx.lineJoin = 'round'
    }

    onMouseDown(e: MouseEvent): void {
        this.drawing = true
        this.ctx.beginPath()
        this.ctx.moveTo(e.offsetX, e.offsetY)
    }

    onMouseMove(e: MouseEvent): void {
        if (!this.drawing) return
        this.ctx.lineTo(e.offsetX, e.offsetY)
        this.ctx.stroke()
    }

    onMouseUp(): void {
        this.drawing = false
    }

    onTouchStart(e: TouchEvent): void {
        e.preventDefault()
        const rect = this.canvasRef.nativeElement.getBoundingClientRect()
        const touch = e.touches[0]
        this.drawing = true
        this.ctx.beginPath()
        this.ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
    }

    onTouchMove(e: TouchEvent): void {
        e.preventDefault()
        if (!this.drawing) return
        const rect = this.canvasRef.nativeElement.getBoundingClientRect()
        const touch = e.touches[0]
        this.ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
        this.ctx.stroke()
    }

    onTouchEnd(): void {
        this.drawing = false
    }

    clear(): void {
        const canvas = this.canvasRef.nativeElement
        this.ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    confirm(): void {
        const dataUrl = this.canvasRef.nativeElement.toDataURL('image/png')
        this.onConfirm.emit(dataUrl)
        this.show = false
    }
}

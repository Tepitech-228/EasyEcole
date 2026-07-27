import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface BatchToolbarAction {
  label: string;
  color: string;
  action: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-batch-toolbar',
  templateUrl: './batch-toolbar.component.html',
  styleUrls: ['./batch-toolbar.component.scss']
})
export class BatchToolbarComponent {
  @Input() selectedCount: number = 0;
  @Input() actions: BatchToolbarAction[] = [];
  @Input() loading: boolean = false;

  @Output() action = new EventEmitter<string>();
  @Output() deselectAll = new EventEmitter<void>();

  onAction(action: string): void {
    this.action.emit(action);
  }

  onDeselectAll(): void {
    this.deselectAll.emit();
  }
}

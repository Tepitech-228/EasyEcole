import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  templateUrl: './form-input.component.html',
  styleUrls: ['./form-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: FormInputComponent
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: FormInputComponent
    }
  ]
})
export class FormInputComponent implements OnInit, ControlValueAccessor, Validator {

  @Input() inputType: string = 'text'
  @Input() placeholder: string | null = null
  @Input() value: string | null = null

  _value: any = null
  onChange: any = () => {}
  onTouched: any = () => {}

  constructor() { }

  ngOnInit(): void {
  }

  writeValue(obj: any): void {
    this._value = obj
  }

  registerOnChange(fn: any): void {
    this.onChange = fn
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn
  }

  setDisabledState?(isDisabled: boolean): void {
  }

  onInput(event: any): void {
    this._value = event.target.value
    this.onChange(this._value)
  }

  onBlur(): void {
    this.onTouched()
  }

  validate(control: AbstractControl): ValidationErrors | null {
    return null
  }

  registerOnValidatorChange?(fn: () => void): void {
  }

}

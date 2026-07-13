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
  // @Input() formControl!: AbstractControl | null

  constructor() { }

  ngOnInit(): void {
  }

  // ControlValueAccessor methods
  writeValue(obj: any): void {
    console.log(obj)
  }

  registerOnChange(fn: any): void {
    console.log(fn)
  }

  registerOnTouched(fn: any): void {
    console.log(fn)
  }

  setDisabledState?(isDisabled: boolean): void {
  }

  // Validator methods
  validate(control: AbstractControl): ValidationErrors | null {
    return null
  }

  registerOnValidatorChange?(fn: () => void): void {
  }

}

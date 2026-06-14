import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TypesMedia } from 'src/app/data/enums/TypesMedia';
import { getClassWithColor } from 'file-icons-js';

@Component({
  selector: 'app-custom-file-picker',
  templateUrl: './custom-file-picker.component.html',
  styleUrls: ['./custom-file-picker.component.scss']
})
export class CustomFilePickerComponent implements OnInit {

  @Input() inputID!: string
  @Input() mediaType: TypesMedia = TypesMedia.IMAGE
  @Output() onFileChanged: EventEmitter<File | null> = new EventEmitter()

  readonly typesMedia = TypesMedia
  file?: File
  isOver: boolean = false
  media?: string

  constructor() { }

  ngOnInit(): void {
  }

  update(file: File | null): void {
    this.onFileChanged.emit(file)
  }

  reset(): void {
    this.removeFile()
  }

  onDropFile(event: any): void {
    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();

    var mediaFile: any
    if (event.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      [...event.dataTransfer.items].forEach((item, i) => {
        // If dropped items aren't files, reject them
        if (item.kind === "file") {
          const file = item.getAsFile();
          mediaFile = file
        }
      });
    } else {
      // Use DataTransfer interface to access the file(s)
      [...event.dataTransfer.files].forEach((file, i) => {
        mediaFile = file
      });
    }

    const type: string = mediaFile.type
    if (type) {
      let isAccepted: boolean = false
      switch (this.mediaType) {
        case TypesMedia.IMAGE:
          isAccepted = ['image/png', 'image/jpg', 'image/jpeg'].includes(type)
          console.log(TypesMedia.IMAGE + ': ' + isAccepted)
          break;

        case TypesMedia.VIDEO:
          isAccepted = type.includes('video/')
          console.log(TypesMedia.VIDEO + ': ' + isAccepted)
          break;

        case TypesMedia.ALL:
          isAccepted = true
          console.log(TypesMedia.ALL + ': ' + isAccepted)
          break;

        default:
          break;
      }

      if (isAccepted) {
        this.media = mediaFile.name
        this.update(mediaFile)

        let mediaInputElement: any = document.getElementById(this.inputID)
        mediaInputElement!.files = event.dataTransfer.files
      }
      else {
        console.log("Not accepted")
      }
    }
    this.isOver = false
  }

  removeFile(): void {
    this.update(null)
    this.media = undefined
    let mediaInputElement: any = document.getElementById(this.inputID)
    mediaInputElement!.value = ''
  }

  onDragOver(event: DragEvent): void {
    this.isOver = true
    event.preventDefault();
  }

  onDragEnter(): void {
    this.isOver = true
  }

  onDragLeave(): void {
    this.isOver = false
  }

  onFileChange(event: any): void {
    this.file = event.target.files[0]
    this.file == undefined ? this.update(null) : this.update(this.file)

    this.media = event.target.files[0].name
    console.log(this.media)
  }

  getFichierRessourceIcone(nomFichier: string): string {
    return getClassWithColor(nomFichier)
  }
}

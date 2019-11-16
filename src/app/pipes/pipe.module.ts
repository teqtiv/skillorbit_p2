import { NgModule } from "@angular/core";
import { SplitPipe,MyTimePipe } from "./split.pipe";



@NgModule({
  imports: [
    // dep modules
  ],
  declarations: [SplitPipe,MyTimePipe],
  exports: [SplitPipe,MyTimePipe]
 
})

export class PipelModule { }
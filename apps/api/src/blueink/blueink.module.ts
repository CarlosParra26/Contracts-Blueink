import { Global, Module } from "@nestjs/common";
import { BlueinkService } from "./blueink.service";

@Global()
@Module({
  providers: [BlueinkService],
  exports: [BlueinkService],
})
export class BlueinkModule {}

import { Inject, Injectable } from "@nestjs/common";
import { AppConfig } from "./configs/app.config.js";
import { type ConfigType } from "@nestjs/config";

@Injectable()
export class AppService {
  constructor(
    @Inject(AppConfig.KEY)
    private readonly appConfig: ConfigType<typeof AppConfig>,
  ) {}

  getHello(): string {
    console.log(this.appConfig);
    return "Hello World!";
  }
}

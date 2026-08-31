import { Controller, Req, Res, All, type RawBodyRequest } from "@nestjs/common";
import { type Request, type Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { ApiExcludeEndpoint } from "@nestjs/swagger";
import { BetterAuthService } from "./better-auth.service.js";

@Controller("better-auth")
export class BetterAuthController {
  constructor(private readonly betterAuthService: BetterAuthService) {}

  @ApiExcludeEndpoint()
  @All("*path")
  async handler(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
    if (req.rawBody) req.body = req.rawBody.toString();
    return toNodeHandler(this.betterAuthService.auth)(req, res);
  }
}

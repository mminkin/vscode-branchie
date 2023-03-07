import { OutputChannel, window, workspace } from "vscode";
import { BranchieConfiguration } from "./branchieConfiguration";

export class BranchieConsole {
  private channel: OutputChannel;

  constructor() {
    this.channel = window.createOutputChannel("Branchie :)");

    if (BranchieConfiguration.isLoggingEnbaled()) {
      this.channel.show();
    }
    this.log("🌤 Rise and grind! Branchie is now active!");
  }

  log(message: string) {
    if (BranchieConfiguration.isLoggingEnbaled()) {
      this.channel.appendLine(message);
    }
  }
}

import { ExtensionContext, OutputChannel, window, workspace } from "vscode";

export class BranchieConsole {
  private channel: OutputChannel;

  constructor() {
    this.channel = window.createOutputChannel("Branchie :)");

    if (this.isLoggingEnbaled()) {
      this.channel.show();
    }
    this.log("🌤 Rise and grind! branchie is now active!");
  }

  isLoggingEnbaled() {
    return workspace.getConfiguration("branchie").get("log");
  }

  log(message: string) {
    if (this.isLoggingEnbaled()) {
      this.channel.appendLine(message);
    }
  }
}

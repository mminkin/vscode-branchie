import { ExtensionContext, Uri, workspace, window, commands } from "vscode";
import { BranchieConsole } from "./branchieConsole";
import { BranchieViews } from "./branchieViews";

export class BranchieCommands {
  constructor(private console: BranchieConsole) {}

  initiallize(context: ExtensionContext, branchieViews: BranchieViews) {
    const openFile = (uri: Uri) => {
      workspace.openTextDocument(uri).then(
        async (file) => {
          await window.showTextDocument(file, { preview: false });
        },
        (error: any) => {
          this.console.log(error);
        }
      );
    };

    const commandList = [
      commands.registerCommand("branchie.refresh", branchieViews.refreshViews),
      commands.registerCommand("branchie.open", openFile),
    ];

    commandList.forEach((command) => context.subscriptions.push(command));
  }
}

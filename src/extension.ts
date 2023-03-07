import { ExtensionContext, workspace } from "vscode";
import { BranchieConsole } from "./branchieConsole";

import { BranchieViews } from "./branchieViews";
import { BranchieCommands } from "./branchieCommands";
import { OpenBranchFilesStorageManager, EditorsManager } from "./files";
import { GitHelper } from "./git";

let openBranchFilesStorageManager: OpenBranchFilesStorageManager;

export async function activate(context: ExtensionContext) {
  const console = new BranchieConsole();

  const gitHelper = await GitHelper.build(console);

  const branchieViews = new BranchieViews(console);
  branchieViews.initiallize(gitHelper);

  workspace.onDidChangeTextDocument(branchieViews.refreshViews);
  workspace.onWillSaveTextDocument(branchieViews.refreshViews);

  const branchieCommands = new BranchieCommands(console);
  branchieCommands.initiallize(context, branchieViews);

  gitHelper.onChangesInRepo(async () => {
    console.log("repo change detected");
    branchieViews.refreshViews();
  });
}

export function deactivate() {
  openBranchFilesStorageManager.saveCurrentBranchFiles();
}


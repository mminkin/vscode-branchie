import { ConfigurationTarget, ExtensionContext, workspace } from "vscode";
import { BranchieConsole } from "./branchieConsole";

import { BranchieViews } from "./branchieViews";
import { BranchieCommands } from "./branchieCommands";
import { OpenBranchFilesStorageManager, EditorsManager } from "./files";
import { GitHelper } from "./git";

let openBranchFilesStorageManager: OpenBranchFilesStorageManager;

export async function activate(context: ExtensionContext) {
  const console = new BranchieConsole();

  await overrideVSCodeWidndowRestore(console);

  const gitHelper = await GitHelper.build(console);
  const editorManager = new EditorsManager(console);

  openBranchFilesStorageManager = new OpenBranchFilesStorageManager(
    context.workspaceState,
    editorManager,
    gitHelper,
    console
  );

  const branchieViews = new BranchieViews();
  branchieViews.initiallize(gitHelper, openBranchFilesStorageManager);

  workspace.onDidChangeTextDocument(branchieViews.refreshViews);
  workspace.onWillSaveTextDocument(branchieViews.refreshViews);

  const branchieCommands = new BranchieCommands(console);
  branchieCommands.initiallize(context, branchieViews);

  gitHelper.onChangesInRepo(async () => {
    console.log("repo change detected");
    await openBranchFilesStorageManager.restoreBranchFiles();
    branchieViews.refreshViews();
  });
}

export function deactivate() {
  openBranchFilesStorageManager.saveCurrentBranchFiles();
}

async function overrideVSCodeWidndowRestore(console: BranchieConsole) {
  const settingName = "restoreWindows";
  const disableSetting = "none";

  console.log("checking your user settings");
  const windowConfiguration = workspace.getConfiguration("window");
  const setting = windowConfiguration.get(settingName);
  console.log(`${settingName}: ${setting}`);

  if (setting !== disableSetting) {
    await windowConfiguration.update(
      settingName,
      disableSetting,
      ConfigurationTarget.Global
    );
    console.log(`updated ${settingName} to ${disableSetting}`);
  }
}

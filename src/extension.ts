import {
  commands,
  ExtensionContext,
  extensions,
  Uri,
  window,
  workspace,
} from "vscode";
import {
  CommittedTreeProvider,
  ModifiedTreeProvider,
  StagedTreeProvider,
} from "./branchieTreeProvider";
import { GitExtension, API as GitApi } from "./git";

export async function activate(context: ExtensionContext) {
  console.log("Rise and grind! branchie is now active!");

  const gitApi = await getGitApi();
  if (!gitApi) {
    window.showErrorMessage("Git was not found");
    return;
  }

  const { refreshViews } = initiallizeViews(gitApi);
  workspace.onWillSaveTextDocument(refreshViews);
  initiallizeCommands(context, refreshViews);
}

// this method is called when your extension is deactivated
export function deactivate() {}

async function getGitApi(): Promise<GitApi | undefined> {
  try {
    const extension = extensions.getExtension<GitExtension>("vscode.git");
    if (extension !== undefined) {
      const gitExtension = extension.isActive
        ? extension.exports
        : await extension.activate();
      return gitExtension.getAPI(1);
    }
  } catch {}

  return undefined;
}

const initiallizeViews = (gitApi: GitApi) => {
  const treeProviders = [
    new StagedTreeProvider(gitApi),
    new ModifiedTreeProvider(gitApi),
    new CommittedTreeProvider(gitApi),
  ];

  treeProviders.forEach((treeProvider) => {
    window.registerTreeDataProvider(
      `branchie-${treeProvider.name}`,
      treeProvider
    );
  });

  return {
    refreshViews: () => {
      treeProviders.forEach((treeProvider) => {
        treeProvider.refresh();
      });
    },
  };
};

const initiallizeCommands = (
  context: ExtensionContext,
  refreshViews: () => void
) => {
  const openFile = (uri: Uri) => {
    workspace.openTextDocument(uri).then((doc) => {
      window.showTextDocument(doc);
    });
  };

  const stageFiles = async () => {
    await commands.executeCommand("git.stage");
    refreshViews();
  };

  const unstageFiles = async () => {
    await commands.executeCommand("git.unstage");
    refreshViews();
  };

  const commit = async () => {
    await commands.executeCommand("git.commitStaged");
    refreshViews();
  };

  const amend = async () => {
    await commands.executeCommand("git.commitStagedAmendNoVerify");
    refreshViews();
  };

  const commandList = [
    commands.registerCommand("branchie.refresh", refreshViews),
    commands.registerCommand("branchie.open", openFile),
    commands.registerCommand("branchie.stage", stageFiles),
    commands.registerCommand("branchie.unstage", unstageFiles),
    commands.registerCommand("branchie.commit.new", commit),
    commands.registerCommand("branchie.commit.amend", amend),
  ];

  commandList.forEach((command) => context.subscriptions.push(command));
};

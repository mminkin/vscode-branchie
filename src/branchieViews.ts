import { window } from "vscode";
import { GitHelper } from "./git";
import { OpenBranchFilesStorageManager } from "./files";
import { CommittedTreeProvider, OpenFilesTreeProvider } from "./treeProviders";

export class BranchieViews {
  refreshViews: () => void;

  constructor() {
    this.refreshViews = () => {};
  }

  initiallize(
    gitHelper: GitHelper,
    openBranchFilesStorageManager: OpenBranchFilesStorageManager
  ) {
    const treeProviders = [
      new OpenFilesTreeProvider(openBranchFilesStorageManager),
      new CommittedTreeProvider(gitHelper),
    ];

    treeProviders.forEach((treeProvider) => {
      window.registerTreeDataProvider(
        `branchie-${treeProvider.name}`,
        treeProvider
      );
    });

    this.refreshViews = () => {
      treeProviders.forEach((treeProvider) => {
        treeProvider.refresh();
      });
    };
  }
}

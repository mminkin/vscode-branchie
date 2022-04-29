import { window } from "vscode";
import { GitHelper } from "./git";
import { WholeBranchTreeProvider, CommitsTreeProvider } from "./treeProviders";
import { BranchieConsole } from "./branchieConsole";

export class BranchieViews {
  refreshViews: () => void;

  constructor(private console: BranchieConsole) {
    this.refreshViews = () => {};
  }

  initiallize(gitHelper: GitHelper) {
    const treeProviders = [
      new WholeBranchTreeProvider(gitHelper),
      new CommitsTreeProvider(gitHelper),
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

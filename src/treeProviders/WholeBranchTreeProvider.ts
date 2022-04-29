import { TreeItem } from "vscode";
import { GitHelper } from "../git";
import { GitRepoHelper } from "../git/gitHelper";
import { BranchieTreeProviderBase } from "./BranchieTreeProvider";

export class WholeBranchTreeProvider extends BranchieTreeProviderBase {
  constructor(gitHelper: GitHelper) {
    super("branch", gitHelper);
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    const master = GitRepoHelper.getMasterCommitHash(this.repo);
    const head = GitRepoHelper.getHeadCommitHash(this.repo);

    return this.getFileItemsBetween(master, head);
  }
}

import { TreeItem } from "vscode";
import { GitHelper } from "../git";
import { GitRepoHelper } from "../git/gitHelper";
import { BranchieTreeProviderBase } from "./BranchieTreeProvider";
import { CommitItem } from "./BranchieTreeItem";

export class CommitsTreeProvider extends BranchieTreeProviderBase {
  constructor(gitHelper: GitHelper) {
    super("committed", gitHelper);
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    return GitRepoHelper.getMasterCommitHash(this.repo).then((master) => {
      const head = GitRepoHelper.getHeadCommitHash(this.repo);

      if (!head || !master) {
        return this.emptyList;
      }

      if (!element) {
        return this.getCommitsListRecursionStart(master, head);
      }

      if (element.contextValue === "commit") {
        return this.getCommitChildren(element.id);
      }

      return this.emptyList;
    });
  }

  async getCommitsListRecursionStart(master: string, head: string) {
    const maxCommits = 10;
    let commits: CommitItem[] = [];

    return this.repo.getMergeBase(head, master).then(async (mergeBase) => {
      return this.getCommitsListRecursion(head, mergeBase, commits, maxCommits);
    });
  }

  async getCommitsListRecursion(
    current: string | undefined,
    mergeBase: string,
    commits: CommitItem[],
    maxCommits: number
  ): Promise<CommitItem[]> {
    if (!current || current === mergeBase || commits.length > maxCommits) {
      return commits;
    }

    return this.repo.getCommit(current).then((currentCommit) => {
      commits.push(new CommitItem(currentCommit.message, currentCommit.hash));
      const previousCommit = GitRepoHelper.getPreviousCommit(currentCommit);

      return this.getCommitsListRecursion(
        previousCommit,
        mergeBase,
        commits,
        maxCommits
      );
    });
  }

  async getCommitChildren(commit: string | undefined) {
    if (!commit) {
      return this.emptyList;
    }

    return GitRepoHelper.getPreviousCommitFromHash(this.repo, commit).then(
      (previousCommitHash) => {
        return this.getFileItemsBetween(previousCommitHash, commit);
      }
    );
  }
}

import { extensions, window } from "vscode";
import { BranchieConfiguration } from "../branchieConfiguration";
import { BranchieConsole } from "../branchieConsole";
import { GitExtension, API as GitApi, Repository, Commit } from "./git";

export class GitHelperBuilder {
  async init(console: BranchieConsole) {
    const gitApi = await this.getGitApi();
    if (!gitApi) {
      window.showErrorMessage("Git was not found");
      return;
    }

    await this.waitForGitInit(gitApi, console);
    return gitApi;
  }

  private async getGitApi(): Promise<GitApi | undefined> {
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

  private async waitForGitInit(
    gitApi: GitApi,
    console: BranchieConsole
  ): Promise<void> {
    if (gitApi.state === "initialized") {
      console.log("git is initialized");
      return;
    }

    console.log("waiting for git to initialize");

    return new Promise((resolve) => {
      gitApi.onDidChangeState(() => {
        console.log("initialization done");
        resolve();
      });
    });
  }
}

export class GitHelper {
  gitApi: GitApi;

  constructor(gitApi: GitApi | undefined) {
    if (!gitApi) {
      throw new Error("Cannot be called directly");
    }
    this.gitApi = gitApi;
  }

  static async build(console: BranchieConsole) {
    const gitApi = await new GitHelperBuilder().init(console);
    return new GitHelper(gitApi);
  }

  getCurrentRepo() {
    return this.gitApi.repositories[0];
  }

  getBranchName = () => {
    return this.getCurrentRepo().state.HEAD?.name;
  };

  onChangesInRepo(listener: (e: void) => any) {
    return this.getCurrentRepo().state.onDidChange(listener);
  }
}

export class GitRepoHelper {
  static async getMasterCommitHash(repo: Repository) {
    const master = BranchieConfiguration.getMasterBranchName();
    return repo.getBranch(master).then((branch) => {
      return branch.commit
    });
  }

  static getHeadCommitHash(repo: Repository) {
    const head = repo.state.HEAD;
    return head?.commit;
  }

  static async getPreviousCommitFromHash(
    repo: Repository,
    commit: string
  ): Promise<string | undefined> {
    return repo.getCommit(commit).then((commitObject) => {
      return GitRepoHelper.getPreviousCommit(commitObject);
    });
  }

  static getPreviousCommit(commit: Commit): string | undefined {
    const parents = commit.parents;
    return parents.length === 1 ? parents[0] : undefined;
  }
}

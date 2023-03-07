import { workspace } from "vscode";

export class BranchieConfiguration {

  private static getConfiguration(configName: string) {
    return workspace.getConfiguration("branchie").get(configName);
  }

  static isLoggingEnbaled() {
    return BranchieConfiguration.getConfiguration("log");
  }

  static getMasterBranchName(): string {
    return BranchieConfiguration.getConfiguration("masterBranch") as string;
  }

}

import * as github from '@actions/github';

type AddLabelsToIssueParams = {
    token: string;
    owner: string;
    repo: string;
    issueNumber: number;
    labels: string[];
};
declare function addLabelsToIssue({ token, owner, repo, issueNumber, labels }: AddLabelsToIssueParams): Promise<void>;

type ActionDeps = {
    getInput?: (name: string) => string;
    setFailed?: (message: string) => void;
    info?: (message: string) => void;
    addLabelsToIssue?: typeof addLabelsToIssue;
    githubContext?: typeof github.context;
    env?: NodeJS.ProcessEnv;
};
declare function runAction(deps?: ActionDeps): Promise<void>;

export { runAction };

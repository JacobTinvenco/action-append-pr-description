const core = require("@actions/core");
const github = require("@actions/github");

const auth = core.getInput("auth");
const repo = core.getInput("repo");
const owner = core.getInput("owner");
const pr = core.getInput("pr");
const text = core.getInput("text");

if (!auth || !repo || !owner || !pr || !text) {
  core.setFailed("Please provide all arguments");
  return 1;
}

const octokit = github.getOctokit(auth);

async function main() {
  const data = await octokit
    .request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
      owner,
      repo,
      pull_number: pr,
    })
    .then(({ data }) => data)
    .catch((error) => core.error(error));

  if (!data) {
    core.setFailed(`Error while getting PR ${pr}`);
    return 1;
  }

  let { body } = data;

  if (!body) {
    core.info("Pull request has no description, setting it to an empty string");
    body = "";
  }

  if (body.includes(text)) {
    core.info("Decription already includes text");
    return 0;
  }

  const updatedBody = `${text}  \n\n ----- \n ${body}`;

  const updateResponse = await octokit
    .request("PATCH /repos/{owner}/{repo}/pulls/{pull_number}", {
      owner,
      repo,
      pull_number: pr,
      body: updatedBody,
    })
    .catch((error) => core.error(error));

  if (!updateResponse) {
    core.setFailed(`Error while updating PR ${pr}`);
    return 1;
  }
}

main();

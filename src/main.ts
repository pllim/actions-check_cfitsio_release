import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
    try {
        const fetch = require("node-fetch");

        const n_days_input = core.getInput("CFITSIO_CHECK_N_DAYS", { required: false });
        const n_days_ms = Number(n_days_input) * 24 * 60 * 60 * 1000;  // ms
        const now = new Date().getTime();
        const n_days_ago = now - n_days_ms;

        const headers = {'user-agent': 'actions-check-cfitsio-release/0.2.0'}
        const changes_url = 'https://heasarc.gsfc.nasa.gov/FTP/software/fitsio/c/docs/changes.txt';
        const response_changes = await fetch(changes_url, {headers: headers});
        const last_modified = new Date(response_changes.headers.get('last-modified'));
        core.info(`DEBUG: last-modified ${last_modified}`);

        if (last_modified.getTime() < n_days_ago) {
            core.info(`Last CFITSIO release made on ${last_modified.toISOString()} before ${new Date(n_days_ago).toISOString()}, nothing to do.`);
            return;
        }

        const gh_token = core.getInput("GITHUB_TOKEN", { required: true });
        const octokit = github.getOctokit(gh_token);

        const fitsio_h_url = 'https://heasarc.gsfc.nasa.gov/FTP/software/fitsio/c/fitsio.h';
        const response_fitsio = await fetch(fitsio_h_url, {headers: headers});
        const fitsio_content = await response_fitsio.text();

        let m = fitsio_content.match('#define CFITSIO_VERSION ([0-9.]*)');
        const cfitsio_version = m[1];
        m = fitsio_content.match('#define CFITSIO_SONAME ([0-9])');
        const cfitsio_soname = m[1];
        core.info(`DEBUG: CFITSIO_VERSION=${cfitsio_version} CFITSIO_SONAME=${cfitsio_soname}`);

        const changes_content = await response_changes.text();
        const changes_lines = changes_content.split("\n");
        let found_ver:boolean = false;
        const latest_change_lines:Array<string> = [];
        for (let i = 0; i < changes_lines.length; i++) {
            let line:string = changes_lines[i];
            if (line.startsWith('Version')) {
                if (found_ver) {
                    break;
                } else {
                    found_ver = true;
                    latest_change_lines.push(line);
                }
            } else if (found_ver) {
                latest_change_lines.push(line);
            }
        }

        const change_log = latest_change_lines.join("\n");
        const issue_title = `ANN: New CFITSIO ${cfitsio_version} released`;
        const issue_body = `New CFITSIO release found.

Version: ${cfitsio_version}
SONAME: ${cfitsio_soname}

#### Change log

${change_log}

(For complete change log information, see ${changes_url} .)`;

        core.info(`${issue_title}\n\n${issue_body}`);
        octokit.issues.create({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            title: issue_title,
            body: issue_body
        });
    } catch(err) {
        core.setFailed(`Action failed with error ${err}`);
    }
}

run();

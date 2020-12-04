# GitHub Action to open issue on new CFITSIO release

Open a GitHub issue if CFITSIO has a new release in the past
`CFITSIO_CHECK_N_DAYS` (default is 7 days). This Action should run
on schedule only every `CFITSIO_CHECK_N_DAYS` days or it is going
to open duplicate issues.

Create a `.github/workflows/check_cfitsio_release.yml` with this:

```
name: Check CFITSIO release

on:
  schedule:
    # Weekly Monday 6 AM build.
    # * is a special character in YAML so you have to quote this string.
    - cron: '0 6 * * 1'

jobs:
  check_cfitsio:
    name: Open issue if new release found
    runs-on: ubuntu-latest
    steps:
    - name: Check release
      uses: pllim/actions-check_cfitsio_release@main
      env:
        CFITSIO_CHECK_N_DAYS: 7
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

```

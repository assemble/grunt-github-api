## Targets

* `src`: is the specified API query path. Source paths are everything that appears after `api.github.com`. Additional information about different query paths can be found in the [Github Developer Documentation](http://developer.github.com/). The `src` can be an `array` or a `string` value.
* `dest`: (optional) - is the path and filename where the retured request should be saved. If nothing is given files will be saved into the same path as the task cache file and will be broken down into a folder structure that mimics its query path. (EXCEPTION: If you define multiple sources that are being concatenated together, you must define at least a filename).


## Configuration

Options may be defined at either the task and/or target levels (_target-level options override task-level options_).

```js
github: {
  // Concatentate returned JSON responses into a single file.
  combindedIssues: {
    options: {
      filters: {
        state: 'open'
      },
      task: {
        concat: true
      }
    },
    src: [
      '/repos/assemble/grunt-github-api-example/issues',
      '/repos/assemble/grunt-github-api/issues'
    ],
    dest: 'combinded-issues.json'
    // File created will be save along the gruntfile.
  },

  // Create two different files from two different repos.
  seperateIssues: {
    options: {
      // Access repo using credentials provided
      oAuth: {
        access_token: 'XXXXXXXXXXXXXXXXXX'
      }
    },
    src: [
      '/repos/assemble/grunt-github-api-example/issues',
      '/repos/assemble/grunt-github-api/issues'
    ]
    // Files created will be saved inside the api-data folder
  },

  // Downloads a copy of the example.json file from GitHub.
  examplePkg: {
    options: {
      task: {
        type: 'file',
      }
    },
    src: '/repos/assemble/grunt-github-api-example/contents/example.json'
    // File created will be saved inside the api-data folder
  }
}
```

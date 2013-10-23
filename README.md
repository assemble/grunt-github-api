# grunt-github-api [![NPM version](https://badge.fury.io/js/grunt-github-api.png)](http://badge.fury.io/js/grunt-github-api) 

> Query Github's API and save the returned JSON files locally.

Project authored and maintained by [github/https://github.com/jeffHerb](https://github.com/jeffHerb).

## Getting Started

This plugin requires Grunt ~0.4.0

If you haven't used Grunt before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a Gruntfile as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

    npm install grunt-github-api --save-dev

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

    grunt.loadNpmTasks('grunt-github-api');

Run this task with the `grunt github` command.

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.


## Options
Options for this plugin are broken down into sub-option categories as defined below. Please note that all option sections by default are objects and contain simple key-value pairs unless otherwise noted.


### output
> Used to idenify where cache and downloaded request data should be stored by default

* **path**: _default: 'api-data'_ - location where all data is collected when saved to disk, if no specific destination is definded under the targets dest.
* **cache**:  _default: '.cache.json'_ - plugin cache file name. Will be stored under under the output path defined above.

#### format
* **indent**:  _default: 4_ - number of spaces each indent should take up.
* **encoding**:  _default: 'utf8'_ - file format all data written to disk should be in.

Examples:

```js
{
  options: {
    output: {
      path: 'my/api/data/',
      cache: 'my/api/cache/'
      format: {
        indent: 4,
        encoding: 'utf8'
      }
    }
  }
}
```


### connection
> Connection headers used when connecting the GitHub.

* **host**: _default: api.github.com_ - default GitHub API portal
* **headers**: _default: {Object}_ used to define the nodejs `HTTPS` headers.
    - `User-Agent`: `node-http/0.10.1`
    - `Content-Type`: `application/json`

Examples:

```js
{
  options: {
    connection: {
      host: 'api.github.com',
      headers: {
        'User-Agent': 'node-http/0.10.1',
        'Content-Type': 'application/json'
      }
    }
  }
}
```

### type
> Type of data the task will be downloading

Indicates the type of request, may be set to either `data` or `file`. Default is `data`.

### cache
> Control which files do or do not get tracked for changes.

Specifies whether or not to cache API responses. Default is `true`.

### concat
> Concatinate JSON data together before writting it to a file when property is set to `true`. Default is `false`.

### filters
> Query search parameters

Additional information about different filters can be found in the [Github Developer Documentation](http://developer.github.com/).


### oAuth
> GitHub access credentials

These credentials are required to preform many actions or continual usage of the plugin. In order to get access using oAuth the repo owner will need to create an access token via their [Application Settings](https://github.com/settings/applications) page.




## Usage Examples
### Targets

* `src`: is the specified API query path. Source paths are everything that appears after `api.github.com`. Additional information about different query paths can be found in the [Github Developer Documentation](http://developer.github.com/). The `src` can be an `array` or a `string` value.
* `dest`: (optional) - is the path and filename where the retured request should be saved. If nothing is given files will be saved into the same path as the task cache file and will be broken down into a folder structure that mimics its query path. (EXCEPTION: If you define multiple sources that are being concatenated together, you must define at least a filename).


### Configuration

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
  },

  // Downloads a copy of the example.json file from GitHub.
  examplePkg: {
    options: {
      task: {
        type: 'file',
      }
    },
    src: '/repos/assemble/grunt-github-api-example/contents/example.json'
  }
}
```



## Contributing
Please see the [Contributing to Assemble](http://assemble.io/contributing) guide for information on contributing to this project.

## Author

+ [github/https://github.com/jeffHerb](https://github.com/jeffHerb)



## License
Copyright (c) 2013 Jeffrey Herb, contributors.
Released under the MIT license

***

_This file was generated on Tue Oct 22 2013 21:23:00._

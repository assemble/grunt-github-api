## Github API

Used to query the Github API and save the returned JSON files locally.

## Getting Started

This plugin requires Grunt ~0.4.0

If you haven't used Grunt before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a Gruntfile as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

    npm install github-api --save-dev

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

    grunt.loadNpmTasks('github-api');

Run this task with the `grunt github` command.

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

## Usage

The github-api module accepts options at both the global and local task level. Special options include `oAuth`, `filters` and `screenDump`.

### Options

- `oAuth` - contain two specific properties; `client_id` and `client_secret`. These credentials are provided by Github, and need to be created by a user with corrent permissions before any secure query will work. Additional information about Github and oAuth2 can be found in their [oAuth documentation](http://developer.github.com/v3/oauth/).

- `filters` - should contain the filtering parameters avaliable to the `src` query defined. Additional information about specific filters can be found in the [Github Developer Documentation](http://developer.github.com/).

- `screenDump` - boolean flag used to determine if the returned JSON should be dumped to the screen. (default is `false`)

- `reqType` - string to indicate if the request type is either `data` or a `file` - (default is `data`)

- `fileEncode` - string to indicate the desired encoding type file contents should be switched to before saving to disk.

### Targets

- `src` - is the specified API query path. Soruce paths are everything that appears after `api.github.com`. Additional information about different query paths can be found in the [Github Developer Documentation](http://developer.github.com/).

- `dest` - is the path and filename where the retured request should be saved.

Example
```js
github: {
    options: {
        oAuth: {
            'client_id': 'XXXXXXXXXXXX',
            'client_secret': 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYY'
        }
    },
    changelog: {
        options: {
            filters: {
                'state': 'open'
            }
        },
        src: '/repos/:org/:repo1/issues', // Get a JSON file for all open issues from repo1
        dest: 'open.json'
    },
    snagFile: {
        options: {
            filters: {
                type: 'public'
            },
            reqType: 'file'
        },
        src: '/repos/:org/:repo/contents/:filename.:ext', // Get a the specific file listed
        dest: 'saveFile.json' // Save the file with this name
    }
}
```

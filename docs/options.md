Options for this plugin are broken down into sub-option categories as defined below. Please note that all option sections by default are objects and contain simple key-value pairs unless otherwise noted.


## output
> Used to idenify where cache and downloaded request data should be stored by default

* **path**: _default: 'api-data'_ - special location where all data is collected when saved to disk, when no specific destination is definded under the targets dest.
* **cache**:  _default: '.cache.json'_ - plugin cache file name. Will be stored under under the output path defined above.

### format
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


## connection
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

## type
> Type of data the task will be downloading

Indicates the type of request, may be set to either `data` or `file`. Default is `data`.

## cache
> Control which files do or do not get tracked for changes.

Specifies whether or not to cache API responses. Default is `true`.

## concat
> Concatinate JSON data together before writting it to a file when property is set to `true`. Default is `false`.

## filters
> Query search parameters

Additional information about different filters can be found in the [Github Developer Documentation](http://developer.github.com/).


## oAuth
> GitHub access credentials

These credentials are required to preform many actions or continual usage of the plugin. In order to get access using oAuth the repo owner will need to create an access token via their [Application Settings](https://github.com/settings/applications) page.


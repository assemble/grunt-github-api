# {%= name %} [![NPM version](https://badge.fury.io/js/{%= name %}.png)](http://badge.fury.io/js/{%= name %}) {% if (travis) { %} [![Build Status]({%= travis %}.png)]({%= travis %}){% } %}

> {%= description %}

Project authored and maintained by [github/{%= author.url %}]({%= author.url %}).

## Getting Started
{%= _.doc("getting-started.md") %}

## Options
{%= _.doc("options.md") %}

## Usage Examples
{%= _.doc("examples.md") %}

## Contributing
Please see the [Contributing to Assemble](http://assemble.io/contributing) guide for information on contributing to this project.

## Author

+ [github/{%= author.url %}]({%= author.url %})

{% if (changelog) { %}
## Release History
{%= _.include("docs-changelog.md") %} {% } else { %}{% } %}

## License
{%= _.copyright() %}
{%= _.license() %}

***

_This file was generated on {%= grunt.template.today() %}._

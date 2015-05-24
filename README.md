# Backbone.Type-to-Search
## Backbone.js plugin
------------
A plugin for Backbone.Collection searches with a HTML _input[type=search]_


### Options

| Value    | Default  | Description |
|----------|----------|------------------------------------------|
| allowCreate | true | if no results found provides _add_ link bound to a _create_entered()_ method |
| logging | false | provides console.log information upon Backbone.js _fetch()_ and _create()_ done by the plugin |
| styles | false | if _true_ will insert _&lt;style>_ element with default styles |

### Methods

| Method    | Description | Returns |
|----------|----------|------------------------------------------|
| handle_results | Builds _$('ul.tts-filtered-collection')_ element that displays results, each in own _&lt;li>_ with _data-id_ attribute | _$('ul.tts-filtered')_ |
| no_results | Creates _$('li.no-results')_ and appends to _$('ul.tts-filtered-collection')_. Creates and appends _$('a.tts-add')_ if _allow_create_ == true | _$('ul.tts-filtered')_ |
| select_result |  ||
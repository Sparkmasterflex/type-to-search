
# Backbone.Type-to-Search
## Backbone.js plugin

A plugin for Backbone.Collection searches with a HTML `input[type=search]`

### Dependencies

* Backbone.js
* Underscore.js
* jQuery

### Getting Started

Include the library and it's dependencies in your project:

```
  <script src="/path/to/jquery.js"></script>
  <script src="/path/to/underscore.js"></script>
  <script src="/path/to/backbone.js"></script>
  <script src="/path/to/type-to-search.js"></script>
```

#### Searchable Collection

You will need to set your collection to _extend_ the `TypeToSeach.Collections.Search` class and add a couple of attributes to your it's Backbone.Model.

```
  # your model
  CircusPeanut = Backbone.Model.extend
    paramRoot: 'circus_peanut'
    urlRoot: '/circus_peanuts'

    searchable: ['color', 'description', 'size']
    label_attr: 'color'

  # your collection
  CircusPeanutsCollection = TypeToSeach.Collections.Search.extend
    model: CircusPeanut
    url: '/circus_peanuts'
```

The `searchable` attribute takes an array of attributes for the model that should be searchable by the plugin. 
### Creating Searching View

The TypeToSearch View is easily instanciated within your model's new, edit or any view really. You will just need access to you Collection class that _extends_ TypeToSeach.Collections.Search collection class.

```
  CarnivalFood.NewView = Backbone.Views.extend
    template: JST['carnival_food/new']
    
    initialize: ->
      _.bindAll this, 'render'
      this.model ?= new CarnivalFood()
      
    render: ->
      this.$el.html this.template(this.model.toJSON())
      this.search_field = new TypeToSeach.Views.SearchView
        input: 'circus_peanut'
        collectionClass: CircusPeanutsCollection
      this.$('.search-field').html this.search_field.render().el
```

And your template:

```
  <form id='new-carnival-food' name='credential'>
    <label for='customer_name'>Customer Name</label>
    <input id='customer_name' type='text' name='customer_name' />
    
    <div class='search-field'>
      <p>Loading...</p>
    </div>
  </form>
```

TypeToSearch will then replace the contents of `.search-field` with two HTML `input`s: 

* `div.type-to-search`
* `label`
* `input[type=search]`
* `input[type=hidden]`

Generated via `TypeToSearch.Views.SearchView`:

```
  <div class="type-to-search">
    <label for="circus_peanut">Circus Peanut</label>
    <input id="circus_peanut" type="search" name="circus_peanut" autocomplete="false" placeholder="Type to Search">
    <input id="circus_peanut_id" type="hidden" name="circus_peanut_id">
  </div>
```


### Required Parameters
| Value    | Type  | Description |
|----------|----------|--------------------------------------|
| input | String | Name attribute needed for search field |
| collectionClass | Backbone.Collection | Collection class to be searched |

### Options

| Value    | Type | Default  | Description |
|-------------|----------|----------|---------|
| currentId | Integer | null | Database id for model instance to be set as selected. |
| allowCreate | Boolean | true | If no results found provides _add_ link bound to a `create_entered()` method |
| label | String | null | `<label>` for `input[type=search]`. If _null_ passed input will be _humanized_. |
| styles | Boolean | false | If _true_ will insert `<style>` element with default styles |
| debug | Boolean | false | Provides console.log information upon Backbone.js `fetch()` and `create()` done by the plugin |


### Methods

All below have default behaviors that can be over-written by passing a callback to the TypeToSearch.Views.SearchView class

| Method    | Description | Returns |
|----------|----------|------------------------------------------|
| handle_results | Builds `$('ul.tts-filtered-collection')` element that displays results, each in own `<li>` with _data-id_ attribute | `$('ul.tts-filtered')` |
| no_results | Creates `$('li.no-results')` and appends to `$('ul.tts-filtered-collection')`. Creates and appends `$('a.tts-add')` if `allowCreate` is true | `$('ul.tts-filtered')` |
| selected_result | Clears results, sets hidden field value (`model.get('id')`) and `input[type=search]` value | Backbone.Model |
| create | When `allowCreate` is true, handles saving new model | Backbone.Model |

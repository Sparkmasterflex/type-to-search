window.TypeToSeach =
  Collections: {}
  Views: {}

class TypeToSeach.Collections.Search extends Backbone.Collection
  initialize: (options) ->
    this.filtered   = []
    this.selected   = null

    {@collection, @collectionClass} = options
    # this.on_select = options.on_select or this.default_on_select

  ###===================
        FILTERING
  ===================###
  set_filters: (filters, value) ->
    # filters
    # == either a single filter key (string)
    # == or JS object of filter/value pairs
    if typeof filters is 'string'
      this.filters[filters] = value
    else
      _.extend this.filters, filters

  clear_filters: -> this.filters = {}

  filtered: ->
    if $.isEmptyObject this.filters
      return this.models
    else
      simple = {}
      _.each this.filters, (val, key) => simple[key] = @filters[key] if val? and ['search'].indexOf(key) < 0
      models = if $.isEmptyObject(simple) then this.models else this.where(simple)
      models = this.search(models, this.filters.search) if this.filters.search?

      models


  ###===================
        SEARCHING
  ===================###
  search: (models, search) ->
    selected = []
    _.each models, (item) =>
      _.each item.searchable, (attr) =>
        if selected.indexOf(item) < 0
          selected.push(item) if @found_search_term(item, attr, search)
    selected

  found_search_term: (item, attr, reg_ex) ->
    if typeof attr is 'string' and item.get(attr)?
      return reg_ex.test item.get(attr).toLowerCase()
    else
      console.log "Getting an error? maybe attributes in searchable doesn't exist" if attr is 'string'
      key = Object.keys(attr)[0]
      child = JSON.parse(item.get(key))
      tested = if $.isArray(child) then this.test_multiple_children(attr[key], child, reg_ex) else this.test_one_child(attr[key], child, reg_ex)
      return tested.indexOf(true) >= 0

  test_multiple_children: (obj, children, reg_ex) ->
    arr = []
    _.each children, (child) => arr.push @test_one_child(obj, child, reg_ex)
    return _.flatten arr

  test_one_child: (obj, child, reg_ex) ->
    arr = []
    _.each obj, (value) => arr.push reg_ex.test child[value].toLowerCase()
    arr



class TypeToSeach.Views.SearchView extends Backbone.View
  className: 'type-to-search'

  initialize: (options) ->
    _.bindAll this, 'render', 'error_message'
    {
      @input, @className, @label,
      @collection, @collectionClass,
      @results, @no_result,
      @logging
    } = options
    this.label ?= this.humanize_input()
    this.logging ?= false
    # this.start_val = this.input.val()

  render: ->
    this.$el.html this.template()
    this.$el.attr 'class', this.className if this.className?
    this.fetch_collection()
    this

  fetch_collection: ->
    this.collection = new this.collectionClass()
    this.collection.fetch
      success: (collection) =>

      error: this.error_message


  template: ->
    """
      <label for="#{this.input}">#{this.label}</label>
      <input id='#{this.input}' type="text" name="#{this.input}" autocomplete="false" placeholder="Type to Search">
      <input id='#{this.input}_id' type="hidden" name="#{this.input}_id">
    """


  humanize_input: ->
    human_readable = ""
    human = this.input.replace /[-_\.]/, " "
    _.each human.split(" "), (str) ->
      human_readable += "#{str.charAt(0).toUpperCase()}#{str.slice(1)} "

    human_readable


  error_message: (error, response, other...) ->
    if this.logging
      console.log 'Collection fetch failed, please check your error logs.'
      console.log error
      console.log response
      console.log other
window.TypeToSeach =
  Collections: {}
  Views: {}

class TypeToSeach.Collections.Search extends Backbone.Collection
  initialize: (options) ->
    this.selected   = null

  ###===================
        FILTERING
  ===================###
  set_filters: (filters, value) ->
    this.filters ?= {}
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

  events:
    'keyup input[type=search]': 'filter_collection'
    'search input[type=search]': 'filter_collection'
    'click .tts-filtered-collection li': 'select_clicked_result'

  initialize: (options) ->
    _.bindAll this, 'render', 'error_message', 'default_handle_results'
    this.options = this.merge_options(options)
    # this.start_val = this.input.val()

  render: ->
    this.$el.html this.template()
    _.each this.options.classes, (c) => this.$el.addClass(c)
    this.$search = this.$("input[type=search]")
    this.fetch_collection()
    this

  ###
    DATA
  ###
  merge_options: (options) ->
    _.extend {
      handle_results: this.default_handle_results
      no_results: this.default_no_results
      select_result: this.select_result
      logging: false
      styles: false
    }, options

  fetch_collection: ->
    this.collection = new this.options.collectionClass()
    this.collection.fetch
      success: (collection) =>
        console.log 'fetched!'
      error: this.error_message


  ###
    DECORATORS
  ###
  template: ->
    """
      <label for="#{this.options.input}">#{this.label()}</label>
      <input id='#{this.options.input}' type="search" name="#{this.options.input}" autocomplete="false" placeholder="Type to Search">
      <input id='#{this.options.input}_id' type="hidden" name="#{this.options.input}_id">
    """

  label: ->
    unless this.options.label?
      human_readable = ""
      human = this.options.input.replace /[-_\.]/, " "
      _.each human.split(" "), (str) ->
        human_readable += "#{str.charAt(0).toUpperCase()}#{str.slice(1)} "
      human_readable
    else
      this.options.label

  add_styles: ->
    this.$el.css 'position', 'relative'
    """
      <style id='tts-styles'>
        .#{this.className} .tts-filtered-collection {
          position: absolute;
          top: #{this.$search.position().top + this.$search.height() + 13}px;
          left: #{this.$search.position().left}px;
          z-index: 500;
          width: 100%;
          background-color: #fff;
          background-color: rgba(255, 255, 255, 0.9);
          border: 1px solid #bbb;
        }
        .#{this.className} .tts-filtered-collection li {
          width: 95%;
          width: calc(100% - 10px);
          padding: 3px 5px;
          border-bottom: 1px solid #bbb;
        }
        .#{this.className} .tts-filtered-collection li:last-child { border-bottom: none; }
        .#{this.className} .tts-filtered-collection li.tts-active { background-color: #ddd; }
      </style>
    """


  ###
    DEBUGGING
  ###
  error_message: (error, response, other...) ->
    if this.options.logging
      console.log 'Collection fetch failed, please check your error logs.'
      console.log error
      console.log response
      console.log other


  ###
    CALLBACKS
  ###
  default_handle_results: (models) ->
    this.selected = null
    if $('ul.tts-filtered-collection').length
      $('ul.tts-filtered-collection').empty()
    else
      this.$search.after "<ul class='tts-filtered-collection'></ul>"
    _.each models, (m) -> $('ul.tts-filtered-collection').append "<li data-id='#{m.get('id')}'>#{m.get("#{m.label_attr}")}</li>"

  default_no_results: ->
    $('ul.tts-filtered-collection')
      .empty()
      .append "<li class='no-results'>No Results Found</li>"

  clear_search: (keep=false) ->
    $('ul.tts-filtered-collection').remove()
    this.$("input##{this.options.input}_id").val null
    this.selected = null unless keep


  ###
    SELECTING RESULT
  ###
  move_select: (direction) ->
    if this.selected?
      $current = $("li[data-id=#{this.selected.get('id')}]")
      $to = if direction is 40 then $current.next('li') else $current.prev('li')
      if $to.length
        $current.removeClass 'tts-active'
        $to.addClass 'tts-active'
        id = $to.data('id')
    else
      $('ul.tts-filtered-collection li:eq(0)').addClass 'tts-active'
      id = $('ul.tts-filtered-collection li:eq(0)').data('id')
    this.selected = this.collection.get(id) if id?

  select_enter_result: ->
    this.selected = this.collection.get($('.tts-active').data('id'))
    this.set_selected_result()

  set_selected_result: ->
    this.clear_search true
    this.$("input##{this.options.input}").val this.selected.get("#{this.selected.label_attr}")
    this.$("input##{this.options.input}_id").val this.selected.get('id')


  ###===================
          EVENTS
  ===================###
  filter_collection: (e) ->
    ###
       9  => 'tab'
      13  => 'enter'
      27  => 'esc'
      38  => 'up arrow'
      40  => 'down arrow'
    ###
    this.$el.prepend this.add_styles() if this.options.styles and not $('style#tts-styles').length
    if e.keyCode? and _.indexOf([9, 13, 38, 40, 27], e.keyCode) < 0
      search = new RegExp(this.$search.val().toLowerCase())
      this.collection.set_filters 'search', search
      filtered = this.collection.filtered()
      if filtered.length
        this.options.handle_results this.collection.filtered()
      else
        this.options.no_results()
    else
      switch e.keyCode
        when 38, 40 then this.move_select(e.keyCode)
        when 27 then this.clear_search()
        when 9, 13 then this.select_enter_result()

  select_clicked_result: (e) ->
    this.selected = this.collection.get($(e.target).data('id'))
    this.set_selected_result()

var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

window.TypeToSeach = {
  Collections: {},
  Views: {}
};

TypeToSeach.Collections.Search = (function(superClass) {
  extend(Search, superClass);

  function Search() {
    return Search.__super__.constructor.apply(this, arguments);
  }

  Search.prototype.initialize = function(options) {
    return this.selected = null;
  };


  /*===================
        FILTERING
  ===================
   */

  Search.prototype.set_filters = function(filters, value) {
    if (this.filters == null) {
      this.filters = {};
    }
    if (typeof filters === 'string') {
      return this.filters[filters] = value;
    } else {
      return _.extend(this.filters, filters);
    }
  };

  Search.prototype.clear_filters = function() {
    return this.filters = {};
  };

  Search.prototype.filtered = function() {
    var models, simple;
    if ($.isEmptyObject(this.filters)) {
      return this.models;
    } else {
      simple = {};
      _.each(this.filters, (function(_this) {
        return function(val, key) {
          if ((val != null) && ['search'].indexOf(key) < 0) {
            return simple[key] = _this.filters[key];
          }
        };
      })(this));
      models = $.isEmptyObject(simple) ? this.models : this.where(simple);
      if (this.filters.search != null) {
        models = this.search(models, this.filters.search);
      }
      return models;
    }
  };


  /*===================
        SEARCHING
  ===================
   */

  Search.prototype.search = function(models, search) {
    var selected;
    selected = [];
    _.each(models, (function(_this) {
      return function(item) {
        return _.each(item.searchable, function(attr) {
          if (selected.indexOf(item) < 0) {
            if (_this.found_search_term(item, attr, search)) {
              return selected.push(item);
            }
          }
        });
      };
    })(this));
    return selected;
  };

  Search.prototype.found_search_term = function(item, attr, reg_ex) {
    var child, key, tested;
    if (typeof attr === 'string') {
      return (item.get(attr) != null) && reg_ex.test(item.get(attr).toLowerCase());
    } else {
      if (attr === 'string') {
        console.log("Getting an error? maybe attributes in searchable doesn't exist");
      }
      key = Object.keys(attr)[0];
      child = JSON.parse(item.get(key));
      tested = $.isArray(child) ? this.test_multiple_children(attr[key], child, reg_ex) : this.test_one_child(attr[key], child, reg_ex);
      return tested.indexOf(true) >= 0;
    }
  };

  Search.prototype.test_multiple_children = function(obj, children, reg_ex) {
    var arr;
    arr = [];
    _.each(children, (function(_this) {
      return function(child) {
        return arr.push(_this.test_one_child(obj, child, reg_ex));
      };
    })(this));
    return _.flatten(arr);
  };

  Search.prototype.test_one_child = function(obj, child, reg_ex) {
    var arr;
    arr = [];
    _.each(obj, (function(_this) {
      return function(value) {
        return arr.push(reg_ex.test(child[value].toLowerCase()));
      };
    })(this));
    return arr;
  };

  return Search;

})(Backbone.Collection);

TypeToSeach.Views.SearchView = (function(superClass) {
  extend(SearchView, superClass);

  function SearchView() {
    return SearchView.__super__.constructor.apply(this, arguments);
  }

  SearchView.prototype.className = 'type-to-search';

  SearchView.prototype.events = {
    'keyup input[type=search]': 'filter_collection',
    'search input[type=search]': 'filter_collection',
    'click .tts-filtered-collection li': 'select_clicked_result'
  };

  SearchView.prototype.initialize = function(options) {
    _.bindAll(this, 'render', 'error_message', 'default_handle_results', 'default_no_results', 'create_entered');
    return this.options = this.merge_options(options);
  };

  SearchView.prototype.render = function() {
    this.$el.html(this.template());
    _.each(this.options.classes, (function(_this) {
      return function(c) {
        return _this.$el.addClass(c);
      };
    })(this));
    this.fetch_collection();
    return this;
  };


  /*
    DATA
   */

  SearchView.prototype.merge_options = function(options) {
    return _.extend({
      handle_results: this.default_handle_results,
      no_results: this.default_no_results,
      selected_result: this.set_selected_result,
      create: this.create_entered,
      label: this.label,
      allow_create: true,
      debug: false,
      styles: false
    }, options);
  };

  SearchView.prototype.fetch_collection = function() {
    this.collection = new this.options.collectionClass();
    return this.collection.fetch({
      success: (function(_this) {
        return function(collection) {
          return _this.set_current_value();
        };
      })(this),
      error: this.error_message
    });
  };

  SearchView.prototype.set_current_value = function() {
    var model;
    this.$search = this.$("input[type=search]");
    if (this.options.currentId != null) {
      model = this.collection.get(this.options.currentId);
      this.$search.val(model.get(model.label_attr));
      return this.$("input#" + this.options.input + "_id").val(this.options.currentId);
    }
  };


  /*
    DECORATORS
   */

  SearchView.prototype.template = function() {
    return "<label for=\"" + this.options.input + "\">" + (this.options.label()) + "</label>\n<input id='" + this.options.input + "' type=\"search\" name=\"" + this.options.input + "\" autocomplete=\"false\" placeholder=\"Type to Search\">\n<input id='" + this.options.input + "_id' type=\"hidden\" name=\"" + this.options.input + "_id\">";
  };

  SearchView.prototype.label = function() {
    var human, human_readable;
    if (this.options.label == null) {
      human_readable = "";
      human = this.options.input.replace(/[-_\.]/, " ");
      _.each(human.split(" "), function(str) {
        return human_readable += "" + (str.charAt(0).toUpperCase()) + (str.slice(1)) + " ";
      });
      return human_readable;
    } else {
      return this.options.label;
    }
  };

  SearchView.prototype.add_styles = function() {
    this.$el.css('position', 'relative');
    return "<style id='tts-styles'>\n  ." + this.className + " .tts-filtered-collection {\n    position: absolute;\n    top: " + (this.$search.position().top + this.$search.height() + 13) + "px;\n    left: " + (this.$search.position().left) + "px;\n    z-index: 500;\n    width: 100%;\n    background-color: #fff;\n    background-color: rgba(255, 255, 255, 0.9);\n    border: 1px solid #bbb;\n  }\n  ." + this.className + " .tts-filtered-collection li {\n    width: 95%;\n    width: calc(100% - 10px);\n    padding: 3px 5px;\n    border-bottom: 1px solid #bbb;\n  }\n  ." + this.className + " .tts-filtered-collection li:last-child { border-bottom: none; }\n  ." + this.className + " .tts-filtered-collection li.tts-active { background-color: #ddd; }\n  ." + this.className + " a.tts-add {\n    position: absolute;\n    top: " + (this.$search.position().top + 3) + "px;\n    right: 5px;\n    z-index: 500;\n  }\n</style>";
  };


  /*
    DEBUGGING
   */

  SearchView.prototype.error_message = function() {
    var error, other, response;
    error = arguments[0], response = arguments[1], other = 3 <= arguments.length ? slice.call(arguments, 2) : [];
    if (this.options.logging) {
      console.log('Collection fetch failed, please check your error logs.');
      console.log(error);
      console.log(response);
      return console.log(other);
    }
  };


  /*
    CALLBACKS
   */

  SearchView.prototype.default_handle_results = function(models) {
    this.selected = null;
    if ($('ul.tts-filtered-collection').length) {
      $('ul.tts-filtered-collection').empty();
    } else {
      this.$search.after("<ul class='tts-filtered-collection'></ul>");
    }
    _.each(models, function(m) {
      return $('ul.tts-filtered-collection').append("<li data-id='" + (m.get('id')) + "'>" + (m.get("" + m.label_attr)) + "</li>");
    });
    return $('ul.tts-filtered-collection');
  };

  SearchView.prototype.default_no_results = function() {
    if (this.options.allow_create && !this.$('a.tts-add').length) {
      this.$search.after("<a href='#add' class='tts-add'>Add?</a>");
      this.$('a.tts-add').click(this.create_entered);
    }
    return $('ul.tts-filtered-collection').empty().append("<li class='no-results'>No Results Found</li>");
  };

  SearchView.prototype.clear_search = function(keep) {
    if (keep == null) {
      keep = false;
    }
    $('ul.tts-filtered-collection, a.tts-add').remove();
    if (!keep) {
      this.$("input#" + this.options.input + "_id").val(null);
      return this.selected = null;
    }
  };


  /*
    SELECTING RESULT
   */

  SearchView.prototype.move_select = function(direction) {
    var $current, $to, id;
    if (this.selected != null) {
      $current = $("li[data-id=" + (this.selected.get('id')) + "]");
      $to = direction === 40 ? $current.next('li') : $current.prev('li');
      if ($to.length) {
        $current.removeClass('tts-active');
        $to.addClass('tts-active');
        id = $to.data('id');
      }
    } else {
      $('ul.tts-filtered-collection li:eq(0)').addClass('tts-active');
      id = $('ul.tts-filtered-collection li:eq(0)').data('id');
    }
    if (id != null) {
      return this.selected = this.collection.get(id);
    }
  };

  SearchView.prototype.select_enter_result = function() {
    this.selected = this.collection.get($('.tts-active').data('id'));
    return this.selected_result();
  };

  SearchView.prototype.set_selected_result = function() {
    this.clear_search(true);
    this.$("input#" + this.options.input).val(this.selected.get("" + this.selected.label_attr));
    this.$("input#" + this.options.input + "_id").val(this.selected.get('id'));
    return this.selected;
  };


  /*===================
          EVENTS
  ===================
   */

  SearchView.prototype.filter_collection = function(e) {

    /*
       9  => 'tab'
      13  => 'enter'
      27  => 'esc'
      38  => 'up arrow'
      40  => 'down arrow'
     */
    var filtered, search;
    if (this.options.styles && !$('style#tts-styles').length) {
      this.$el.prepend(this.add_styles());
    }
    if ((e.keyCode != null) && _.indexOf([9, 13, 38, 40, 27], e.keyCode) < 0) {
      search = new RegExp(this.$search.val().toLowerCase());
      this.collection.set_filters('search', search);
      filtered = this.collection.filtered();
      if (filtered.length) {
        return this.options.handle_results(filtered);
      } else {
        return this.options.no_results();
      }
    } else {
      switch (e.keyCode) {
        case 38:
        case 40:
          return this.move_select(e.keyCode);
        case 27:
          return this.clear_search();
        case 9:
        case 13:
          return this.select_enter_result();
      }
    }
  };

  SearchView.prototype.select_clicked_result = function(e) {
    this.selected = this.collection.get($(e.target).data('id'));
    return this.set_selected_result();
  };

  SearchView.prototype.create_entered = function() {
    var attrs, modelClass;
    modelClass = this.collection.model;
    attrs = {};
    attrs[this.collection.first().label_attr] = this.$search.val();
    this.collection.create(new modelClass(attrs), {
      wait: false,
      success: (function(_this) {
        return function(model) {
          _this.selected = model;
          _this.set_selected_result();
          return alert((model.get(model.label_attr)) + " was successfully created!");
        };
      })(this),
      error: this.error_message
    });
    return false;
  };

  return SearchView;

})(Backbone.View);

// ---
// generated by coffee-script 1.9.2
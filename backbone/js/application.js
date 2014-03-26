$(function(){
  // Our basic **Registry** model has `title`, `order`, and `done` attributes.
	var RegistryItem = Backbone.Model.extend({
		// Default attributes for the registry item.
		defaults: function() {
			return {
				id: null,
				title: "empty registry...",
				description: '',
				image: '',
				price: 0.00,
				order: Registry.nextOrder,
				purchased: false
			};
		},
		
		// Toggle the `purchased` state of this registry item.
		toggle: function() {
		  this.save({done: !this.get("purchased")});
		}
		
  });

  // Registry Collection
  // ---------------

  // The collection of registry items is backed by *localStorage* instead of a remote
  // server.
  var RegistryList = Backbone.Collection.extend({
    model: RegistryItem,
		url: '/dummy/',
    // Save all of the registry items under the `"registry-backbone"` namespace.
    localStorage: new Backbone.LocalStorage.constructor("registry-backbone"),

    // Filter down the list of all registry items that are finished.
    done: function() {
      return this.where({purchased: true});
    },
    // Filter down the list to only registry items that are still not finished.
    remaining: function() {
      return this.where({purchased: false});
    },
    // We keep the Registry items in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },
    // Registry are sorted by their original insertion order.
    comparator: 'order'
  });

	var CartList = Backbone.Collection.extend({
		model: RegistryItem,
		url: '#',
		done: function(){
			return this.where({purchased: true})
		}
	});

  // Create our global collection of **Registry**.
  var Registry = new RegistryList;
	var Cart = new CartList;

	var CartView = Backbone.View.extend({
		tagName: 'li',
		template: _.template($('#cart-template').html()),
		events: {
			'click button.delete': 'remove'
		},
		remove: function(e){
			$(e.target).closest('.row').remove();
			if(this.$el.find('div.row').size() == 0){
				this.$el.find('#no-items').show();
			}
			e.preventDefault();
			return false;
		},
		initialize: function(){
			this.listenTo(this.model, 'destroy', this.remove);
		},
		render: function(){
			this.$el.find('#no-items').hide();
			this.$el.append(this.template(this.model.toJSON()));
		}
	});

  // Registry Item View
  // --------------

  // The DOM element for a registry item...
  var RegistryView = Backbone.View.extend({
    //... is a list tag.
    tagName:  "li",
    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),
    // The DOM events specific to an item.
    events: {
      "click .add"			: "toggleAdded",
      "click a.delete" :  "clear"
    },
    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },
		remove: function(){
			this.clear();
		},
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},
		toggleAdded: function() {
			var cartitem = new CartView({ model: this.model, el: '#cart' });
			cartitem.render();
		},
    clear: function() {
      this.model.destroy();
    }

  });

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  var AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#registry-items"),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #new-registry":  "createOnEnter",
    },

    // At initialization we bind to the relevant events on the `Registry`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting registrys that might be saved in *localStorage*.
    initialize: function() {
			var items = [
				new RegistryItem({
					id: 1,
					title: 'Green Dishes',
					description: 'Corelle glass dinnerware always features great design along with its famous durability.',
					price: 25.95,
					image: 'img/green-dishes.jpg'
				}),
				new RegistryItem({
					id: 2,
					title: 'Curtains',
					description: 'A quiet bungalow, an urban loft, or a sophisticated townhouse—no matter what you call home, these curtains bring a warm and inviting feel to every room',
					image: 'img/curtains.JPG',
					price: 99.99
				}),
				new RegistryItem({
					id: 3,
					title: '20 Piece Flatware Set',
					description: 'The liquid shine of the Threshold Kayden 20 Piece Flatware Set adds polish to your table setting.',
					price: 29.99,
					image: 'img/flatware.jpg'
				}),
				new RegistryItem({
					id: 4,
					title: 'Red Toolbox',
					description: 'Holds all kinds of manly tools.',
					price: 49.99,
					image: 'img/toolbox.jpg'
				})
			];
			
      this.input = this.$("#new-registry");
      this.allCheckbox = this.$("#toggle-all")[0];

      this.listenTo(Registry, 'add', this.addOne);
      this.listenTo(Registry, 'reset', this.addAll);
      this.listenTo(Registry, 'all', this.render);

      this.footer = this.$('footer');
      this.main = $('#main');

			for(var i = 0; i < items.length; i++){
				Registry.add(items[i]);
			}
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      var done = Registry.done().length;
      var remaining = Registry.remaining().length;

      if (Registry.length) {
        this.main.show();
      } else {
        this.main.hide();
      }
    },

    // Add a single registry item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(registry) {
      var view = new RegistryView({model: registry});
      $("#registry-items").append(view.render().el);
    },

    // Add all items in the **Registry** collection at once.
    addAll: function() {
      Registry.each(this.addOne, this);
    }
  });

  // Finally, we kick things off by creating the **App**.
  var App = new AppView;

	$('#refresh').on('click', function(){
		Registry.add(new RegistryItem({
			id: 6,
			title: 'Mudhut™ Hope Reversible Quilt Set',
			description: 'Snuggle in to comfort with the Mudhut Hope Reversible Quilt Set.',
			price: 89.99,
			image: 'img/bedspread.jpg'
		}))
	})
});
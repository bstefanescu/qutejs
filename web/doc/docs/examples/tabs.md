# Creating a Tab Bar

These examples demonstrates the usage of:

1. the **[for](#/directives/for)** directive.
2. the **[view](#/directives/view)** directive.
3. the **[tag](#/directives/tag)** directive.
4. the **[x-class](#/attributes/x-class)** attribute directive.

## A Simple Tab Bar

```jsq

//import Qute from '@qutejs/runtime';
//import '@qutejs/group';

// -------------------------------------------------- Tab Bar styles

<x-style>
.tabs {
	margin: 0 0 10px 0; padding: 0;
	list-style-type: none;
}
.tabs > li {
	margin-right: 8px;
	display: inline-block;
	padding: 2px 4px;
	border-bottom: 1px solid transparent;
}
.tabs > li.active {
	border-bottom: 1px solid green;
}
.tabs > li > a {
	text-decoration: none;
}
.tabs > li > a:hover, .tabs > li > a:active {
	text-decoration: none;
}
</x-style>

// --------------------------------------------------- Tab Bar template

<x-tag name='tab-bar'>
	<div x-attrs>
		<ul class='tabs'>
			<for value='tab in tabs'>
				<li x-class='{active: tab.active}'>
					<a href={'#'+tab.name} @click={activeTab = tab}>{{tab.label}}</a>
				</li>
			</for>
		</ul>
		<div>
			<view is='activeView'></view>
		</div>
	</div>
</x-tag>

// --------------------------------------------------- Tab Bar component

Qute('tab-bar', {
	init() {
		return { tabs: null }
	},
	get activeView() { return this.activeTab && this.activeTab.view },
	get activeTab() {
		var tab = null;
		if (this.tabs) {
			var tab = this.tabs.find(tab => tab.active);
		}
		return tab || null;
	},
	set activeTab(tab) {
		var oldTab = this.tabs.find(tab => tab.active);
		if (oldTab !== tab)	{
			if (oldTab) oldTab.active = false;
			tab.active = true;
			this.update();
		}
	}
});

// --------------------------------------------------- Usage

<x-tag name='home-page'>
	<div>The home page</div>
</x-tag>
<x-tag name='settings-page'>
	<div>The settings page</div>
</x-tag>

<x-tag name='root'>
	<tab-bar tabs={tabs} />
</x-tag>

export default Qute('root', {
	init() {
		return {
			tabs: [
				{name: 'home', label: 'Home', view: 'home-page', active: true},
				{name: 'settings', label: 'Settings', view: 'settings-page'}
			]
		}
	}
});
```

## Advanced Tab Bar Implemenetation

Starting from previous example we can add more features like:

1. an area to be able to add custom actions on the right of the tabs bar
2. the posibility to use custom tab components.

In this example we will define a custom tab that contains a `remove` action, and we add an `add` button in the tab actions area. The `remove` and `add` actiond are not implemented to keep the example short.

Note that most of the code in the example is `css` code. The javascript code of the tabbar component is in contrast ver short, thanks to the Qute expressive model.

```jsq

//import Qute from '@qutejs/runtime';
//import '@qutejs/group';

// -------------------------------------------------- Tab Bar styles

<x-style>
.tbar {
	display: flex;
	justify-content: space-between;
	margin: 0 0 10px 0; padding: 0;
}
.tbar-actions {
	padding: 2px 0;
}
.tbar-tabs {
	margin: 0; padding: 0;
	list-style-type: none;
}
.tbar-tabs > li {
	margin-right: 8px;
	display: inline-block;
	padding: 2px 4px;
	border-bottom: 1px solid transparent;
}
.tbar-tabs > li.active {
	border-bottom: 1px solid green;
}
.tbar-tabs > li > a {
	text-decoration: none;
}
.tbar-tabs > li > a:hover, .tabs > li > a:active {
	text-decoration: none;
}
.custom-tab a, .custom-tab a:hover, .custom-tab a:active {
	text-decoration:none;
}
.close {
	opacity: 0.6;
	font-weight: 500;
	color: red !important;
	text-decoration:none;
}
.close:hover {
	opacity: 1;
	text-decoration:none;
}
</x-style>

// --------------------------------------------------- Tab Bar template

<x-tag name='tab-bar'>
	<div x-attrs>
		<div class='tbar'>
			<ul class='tbar-tabs'>
				<for value='tab in tabs'>
					<li x-class='{active: tab.active}'>
						<if value='tab.component'>
							<tag is={tab.component} tab={tab} @select={activeTab = tab} />
						<else />
							<a href={'#'+tab.name} @click={activeTab = tab}>{{tab.label}}</a>
						</if>
					</li>
				</for>
			</ul>
			<div class='tbar-actions'><slot/></div>
		</div>
		<div class='tb-view'>
			<view is='activeView'></view>
		</div>
	</div>
</x-tag>

// --------------------------------------------------- Tab Bar component

Qute('tab-bar', {
	init() {
		return { tabs: null }
	},
	get activeView() { return this.activeTab && this.activeTab.view },
	get activeTab() {
		var tab = null;
		if (this.tabs) {
			var tab = this.tabs.find(tab => tab.active);
		}
		return tab || null;
	},
	set activeTab(tab) {
		var oldTab = this.tabs.find(tab => tab.active);
		if (oldTab !== tab)	{
			if (oldTab) oldTab.active = false;
			tab.active = true;
			this.update();
		}
	}
});

// --------------------------------------------------- Usage

<x-tag name='home-page'>
	<div>The home page</div>
</x-tag>
<x-tag name='settings-page'>
	<div>The settings page</div>
</x-tag>
<x-tag name='custom-tab'>
	<div class='custom-tab'>
		<a href='#' x-html={$attrs.tab.label} x-emit:select@click></a>
		<a href='#' x-emit:remove@click class='close'>&times;</a>
	</div>
</x-tag>

<x-tag name='root'>
	<tab-bar tabs={tabs} @remove='onTabRemove' @add='onTabAdd'>
		<button x-emit:add@click>Add</button>
	</tab-bar>
</x-tag>

export default Qute('root', {
	init() {
		return {
			tabs: [
				{name: 'home', label: 'Home', view: 'home-page', active: true},
				{name: 'settings', label: 'Settings', view: 'settings-page', component: 'custom-tab'},
			]
		}
	},
	onTabRemove() {
		window.alert('Handle tab remove ...');
	},
	onTabAdd() {
		window.alert('Handle tab add ...');
	}
});
```
# Creating a Tab Bar

These examples demonstrates the usage of:

1. the **[for](#/directives/for)** directive.
2. the **[view](#/directives/view)** directive.
3. the **[tag](#/directives/tag)** directive.
4. the **[q:class](#/attributes/q-class)** attribute directive.

## A Simple Tab Bar

```jsq
import Qute from '@qutejs/runtime';

// -------------------------------------------------- Tab Bar styles

<q:style>
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
</q:style>

// --------------------------------------------------- Tab Bar template

<q:template name='TabBarTemplate'>
	<div q:attrs>
		<ul class='tabs'>
			<for value='tab in tabs'>
				<li q:class='{active: tab.active}'>
					<a href={'#'+tab.name} @click={activeTab = tab}>{{tab.label}}</a>
				</li>
			</for>
		</ul>
		<div>
			<view is={activeView}></view>
		</div>
	</div>
</q:template>

// --------------------------------------------------- Tab Bar component

const TabBar = Qute(TabBarTemplate, {
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

<q:template name='HomePage'>
	<div>The home page</div>
</q:template>
<q:template name='SettingsPage'>
	<div>The settings page</div>
</q:template>

<q:template name='RootTemplate'>
	<tab-bar tabs={tabs} />
</q:template>

export default Qute(RootTemplate, {
	init() {
		return {
			tabs: [
				{name: 'home', label: 'Home', view: HomePage, active: true},
				{name: 'settings', label: 'Settings', view: SettingsPage}
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
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

// -------------------------------------------------- Tab Bar styles

<q:style>
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
</q:style>

// --------------------------------------------------- Tab Bar template

<q:template name='TabBarTemplate'>
	<div q:attrs>
		<div class='tbar'>
			<ul class='tbar-tabs'>
				<for value='tab in tabs'>
					<li q:class='{active: tab.active}'>
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
			<view is={activeView}></view>
		</div>
	</div>
</q:template>

// --------------------------------------------------- Tab Bar component

const TabBar = Qute(TabBarTemplate, {
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

<q:template name='HomePage'>
	<div>The home page</div>
</q:template>
<q:template name='SettingsPage'>
	<div>The settings page</div>
</q:template>
<q:template name='CustomTab'>
	<div class='custom-tab'>
		<a href='#' q:html={$attrs.tab.label} q:emit-select-onclick></a>
		<a href='#' q:emit-remove-onclick class='close'>&times;</a>
	</div>
</q:template>

<q:template name='RootTemplate'>
	<tab-bar tabs={tabs} @remove='onTabRemove' @add='onTabAdd'>
		<button q:emit-add-onclick>Add</button>
	</tab-bar>
</q:template>

export default Qute(RootTemplate, {
	init() {
		return {
			tabs: [
				{name: 'home', label: 'Home', view: HomePage, active: true},
				{name: 'settings', label: 'Settings', view: SettingsPage, component: CustomTab},
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

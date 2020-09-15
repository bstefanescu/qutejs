# Application Data and Services Example

```jsq
//@style https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css

import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
import qSpinner from '@qutejs/spinner';

<q:style>
.tbar {
	list-style:none;
	padding: 0;
	margin: 0;
}
.tbar > li {
	display: inline-block;
	padding: 2px 2px;
	margin: 0 4px;
}
.tbar > li.active {
	border-bottom: 1px solid green;
}
.tbar a, .tbar a:hover, .tbar a:active {
	text-decoration: none;
}
.main {
	margin-left: 6px;
	margin-top: 10px;
}
</q:style>

<q:template name='PagePlaceholder'>
	<div>Click on the tab bar to open a page</div>
</q:template>
<q:template name='PageOne'>
	<div>Page 1 content</div>
</q:template>
<q:template name='PageTwo'>
	<div>Page 2 content</div>
</q:template>
<q:template name='PageThree'>
	<div>Page 3 content</div>
</q:template>

<q:template name='RootTemplate'>
	<div>
		<div class='clearfix'>
			<ul class='tbar' style='float:left' @click='onTabClick'>
				<li><a href='#' data-key='page1'>Page 1</a></li>
				<li><a href='#' data-key='page2'>Page 2</a></li>
				<li><a href='#' data-key='page3'>Page 3</a></li>
			</ul>
			<div style='float:right'>
				<if value='user'>
				Hello {{user}}!
				<button @click='logout'>Logout</button>
				<else />
				<q:spinner size='8px' inline q:show='loginPending'/>
				<button @click='login' q:toggle-disabled={loginPending}>Login</button>
				</if>
			</div>
		</div>
		<div class='main'>
			<view is='currentPage' />
		</div>
	</div>
</q:template>

var pages = {
    page1: PageOne,
    page2: PageTwo,
    page3: PageThree
}

var Root = Qute(RootTemplate, {
	init(app) {
		return {
			user: app.prop('Session/user'),
			loginPending: app.prop('Session/user/pending'),
			loginError: app.prop('Session/user/error'),
			currentPage: app.prop('Pages/current')
		};
	},
	login() {
		this.$app.session.login('Foo');
	},
	logout() {
		this.$app.session.logout();
	},
	onTabClick(e) {
        var page = pages[e.target.getAttribute('data-key')]
		if (page) {
			e.currentTarget.querySelectorAll('li').forEach(li => li.classList.remove('active'));
			e.target.closest('li').classList.add('active');
			this.currentPage = page;
		}
	}
});

function SessionManager(app) {
	app.defineAsyncProp('Session/user', null).link(this, 'user');
	this.login = function(user) {
		// simulate an async request
		// this will update the components depending on 'Session/user' when the promise will be either fulfilled or rejected
		this.user = new Promise((resolve, reject) => {
			// simulate login success
			window.setTimeout(() => { resolve(user); }, 1000);
		});
	}
	this.logout = function() {
		this.user = null;
	}
}

function PageManager(app) {
	app.defineProp('Pages/current', PagePlaceholder).link(this, 'currentPage');
	this.open = function(page) {
		this.currentPage = page;
	}
	this.close = function() {
		this.currenPage = null;
	}
}

var app = new Qute.App();
app.session = new SessionManager(app);
app.pages = new PageManager(app);

new Root(app).mount('app');
```
